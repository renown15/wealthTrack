"""
FastAPI middleware components.
"""
import json
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SnakeToCamelCaseMiddleware(BaseHTTPMiddleware):
    """Transforms all JSON response bodies from snake_case to camelCase."""

    @staticmethod
    def _to_camel_case(snake_str: str) -> str:
        """Convert snake_case string to camelCase."""
        components = snake_str.split("_")
        return components[0] + "".join(x.title() for x in components[1:])

    @staticmethod
    def _transform_keys(obj: object) -> object:
        """Recursively transform dict keys from snake_case to camelCase."""
        if isinstance(obj, dict):
            return {
                SnakeToCamelCaseMiddleware._to_camel_case(k): (
                    SnakeToCamelCaseMiddleware._transform_keys(v)
                )
                for k, v in obj.items()
            }
        if isinstance(obj, list):
            return [SnakeToCamelCaseMiddleware._transform_keys(item) for item in obj]
        return obj

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Intercept response and transform JSON keys."""
        response = await call_next(request)

        if "application/json" not in response.headers.get("content-type", ""):
            return response

        body = b""
        async for chunk in response.body_iterator:  # type: ignore[attr-defined]
            body += chunk

        try:
            data = json.loads(body)
            transformed = self._transform_keys(data)
            transformed_body: bytes = json.dumps(transformed).encode()
            headers = dict(response.headers)
            headers.pop("content-length", None)
            return Response(
                content=transformed_body,
                status_code=response.status_code,
                headers=headers,
                media_type=response.media_type,
            )
        except (json.JSONDecodeError, UnicodeDecodeError, TypeError):
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )
