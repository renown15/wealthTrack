#!/usr/bin/env python3
"""
Generate TypeScript types from the FastAPI OpenAPI spec.

Usage: python3 scripts/generate-api-types.py
       (backend must be running: make dev or make backend-dev)

The generated file frontend/src/types/api.gen.ts is the authoritative
contract between backend and frontend. Commit it whenever backend schemas
change, then run 'make pr-check' — vue-tsc will catch any incompatibilities.
"""
import json
import os
import subprocess
import sys
import tempfile
import urllib.request

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
OUTPUT_PATH = os.path.join(FRONTEND_DIR, "src", "types", "api.gen.ts")


def fetch_spec() -> dict:
    url = f"{BACKEND_URL}/openapi.json"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"ERROR: Could not reach backend at {url}")
        print(f"       {e}")
        print("       Make sure the backend is running: make dev or make backend-dev")
        sys.exit(1)


def _body_ref(schema: dict) -> str:
    """
    Return a Body_* component $ref from a requestBody schema, whether it is a
    direct $ref or wrapped in an `allOf` (FastAPI wraps the ref in allOf with a
    title when the body is optional, e.g. an endpoint whose only Form field has
    a default).
    """
    ref = schema.get("$ref", "")
    if not ref:
        for sub in schema.get("allOf", []):
            ref = sub.get("$ref", "")
            if ref:
                break
    return ref


def patch_spec(spec: dict) -> dict:
    """
    FastAPI emits $ref pointers to Body_* schemas for file-upload and Form
    endpoints but never defines those schemas in components. openapi-typescript
    refuses to generate with unresolvable $refs, so we inline the schemas here.
    """
    for _path, methods in spec.get("paths", {}).items():
        for _method, op in methods.items():
            content = op.get("requestBody", {}).get("content", {})
            for ct, body in content.items():
                ref = _body_ref(body.get("schema", {}))
                if ref.startswith("#/components/schemas/Body_"):
                    if "multipart" in ct:
                        body["schema"] = {
                            "type": "object",
                            "properties": {"file": {"type": "string", "format": "binary"}},
                        }
                    else:
                        body["schema"] = {
                            "type": "object",
                            "properties": {"description": {"type": "string"}},
                        }
    return spec


def main() -> None:
    print(f"Fetching OpenAPI spec from {BACKEND_URL}...")
    spec = fetch_spec()
    spec = patch_spec(spec)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(spec, f)
        tmp = f.name

    rel_output = os.path.relpath(OUTPUT_PATH, FRONTEND_DIR)
    print(f"Generating TypeScript types -> {rel_output}...")

    result = subprocess.run(
        ["npx", "openapi-typescript", tmp, "-o", rel_output],
        cwd=FRONTEND_DIR,
        capture_output=True,
        text=True,
    )
    os.unlink(tmp)

    if result.returncode != 0:
        print(result.stderr)
        sys.exit(1)

    print(result.stdout.strip())
    print()
    print("Done. Run 'make pr-check' to verify frontend types are still valid.")


if __name__ == "__main__":
    main()
