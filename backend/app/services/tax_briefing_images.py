"""Compress tax-document images for embedding in the briefing PDF."""
from __future__ import annotations

import io

from PIL import Image as PILImage
from PIL import UnidentifiedImageError
from reportlab.lib.units import mm
from reportlab.platypus import Image

_MAX_PIXELS = 1000  # cap longest edge after downscale
_JPEG_QUALITY = 70
_MAX_DISPLAY_WIDTH = 150 * mm
_MAX_DISPLAY_HEIGHT = 180 * mm

_IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp")
_IMAGE_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/bmp",
}


def is_image(content_type: str | None, filename: str) -> bool:
    """True when a document looks like an embeddable raster image."""
    if content_type and content_type.lower() in _IMAGE_CONTENT_TYPES:
        return True
    return filename.lower().endswith(_IMAGE_EXTENSIONS)


def _fit_dimensions(px_w: int, px_h: int) -> tuple[float, float]:
    if px_w <= 0 or px_h <= 0:
        return _MAX_DISPLAY_WIDTH, _MAX_DISPLAY_HEIGHT
    ratio = px_h / px_w
    width = _MAX_DISPLAY_WIDTH
    height = width * ratio
    if height > _MAX_DISPLAY_HEIGHT:
        height = _MAX_DISPLAY_HEIGHT
        width = height / ratio
    return width, height


def compress_document_image(file_data: bytes) -> Image | None:
    """Downscale + JPEG-compress image bytes into a page-fitted reportlab Image.

    Returns None when the bytes are not a decodable image.
    """
    try:
        with PILImage.open(io.BytesIO(file_data)) as src:
            rgb = src.convert("RGB")
            rgb.thumbnail((_MAX_PIXELS, _MAX_PIXELS))
            buffer = io.BytesIO()
            rgb.save(buffer, format="JPEG", quality=_JPEG_QUALITY, optimize=True)
            px_w, px_h = rgb.size
    except (UnidentifiedImageError, OSError, ValueError):
        return None

    buffer.seek(0)
    width, height = _fit_dimensions(px_w, px_h)
    return Image(buffer, width=width, height=height)
