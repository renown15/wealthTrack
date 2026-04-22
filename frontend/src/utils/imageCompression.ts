/**
 * Client-side image compression using the Canvas API.
 * Non-image files are returned unchanged.
 */

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => { resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

function scaleDown(width: number, height: number): { width: number; height: number } {
  const max = MAX_DIMENSION;
  if (width <= max && height <= max) return { width, height };
  const ratio = width > height ? max / width : max / height;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

export async function compressFile(file: File): Promise<File> {
  if (!isImage(file)) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = scaleDown(img.naturalWidth, img.naturalHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = outputType === 'image/jpeg' ? JPEG_QUALITY : undefined;

    return new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: outputType }));
        },
        outputType,
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
