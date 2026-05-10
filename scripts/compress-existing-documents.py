#!/usr/bin/env python3
"""
One-time script to compress existing images stored in TaxDocument and AccountDocument.

Applies the same rules as frontend/src/utils/imageCompression.ts:
  - Max dimension: 1200px (scale down proportionally if larger)
  - JPEG quality: 80%
  - PNG files: lossless re-encode (no quality param)
  - Non-image files: skipped

Usage:
    python scripts/compress-existing-documents.py
    DB_HOST=localhost DB_PORT=5433 DB_USER=wealthtrack DB_PASSWORD=wealthtrack_dev_password DB_NAME=wealthtrack python scripts/compress-existing-documents.py
"""
import io
import os
import sys

import psycopg2
from PIL import Image

MAX_DIMENSION = 1200
JPEG_QUALITY = 80

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5433")
DB_USER = os.environ.get("DB_USER", "wealthtrack")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "wealthtrack_dev_password")
DB_NAME = os.environ.get("DB_NAME", "wealthtrack")

TABLES = [
    ("TaxDocument", "taxreturnid"),
    ("AccountDocument", "accountid"),
]


def scale_down(width: int, height: int) -> tuple[int, int]:
    if width <= MAX_DIMENSION and height <= MAX_DIMENSION:
        return width, height
    ratio = MAX_DIMENSION / max(width, height)
    return round(width * ratio), round(height * ratio)


def compress_image(data: bytes, content_type: str | None) -> bytes | None:
    if not content_type or not content_type.startswith("image/"):
        return None
    img = Image.open(io.BytesIO(data))
    new_w, new_h = scale_down(img.width, img.height)
    if new_w != img.width or new_h != img.height:
        img = img.resize((new_w, new_h), Image.LANCZOS)
    out = io.BytesIO()
    if content_type == "image/png":
        img.save(out, format="PNG", optimize=True)
    else:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return out.getvalue()


def process_table(cur: psycopg2.extensions.cursor, table: str, fk_col: str) -> None:
    cur.execute(f'SELECT id, filename, content_type, length(file_data) FROM "{table}" ORDER BY id')
    rows = cur.fetchall()
    if not rows:
        print(f"  {table}: no rows")
        return
    for doc_id, filename, content_type, original_size in rows:
        if not content_type or not content_type.startswith("image/"):
            print(f"  {table} id={doc_id} ({filename}): skipped (not an image)")
            continue
        cur.execute(f'SELECT file_data FROM "{table}" WHERE id = %s', (doc_id,))
        (file_data,) = cur.fetchone()
        compressed = compress_image(bytes(file_data), content_type)
        if compressed is None:
            print(f"  {table} id={doc_id} ({filename}): skipped")
            continue
        new_size = len(compressed)
        saving = original_size - new_size
        pct = saving / original_size * 100 if original_size else 0
        if saving <= 0:
            print(f"  {table} id={doc_id} ({filename}): already optimal, skipping")
            continue
        cur.execute(
            f'UPDATE "{table}" SET file_data = %s WHERE id = %s',
            (psycopg2.Binary(compressed), doc_id),
        )
        print(f"  {table} id={doc_id} ({filename}): {original_size:,} → {new_size:,} bytes ({pct:.1f}% smaller)")


def main() -> None:
    conn = psycopg2.connect(
        host=DB_HOST, port=int(DB_PORT), user=DB_USER,
        password=DB_PASSWORD, dbname=DB_NAME,
    )
    try:
        with conn:
            with conn.cursor() as cur:
                for table, fk_col in TABLES:
                    process_table(cur, table, fk_col)
        print("Done.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
