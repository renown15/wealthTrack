/**
 * Rotate an image File by a multiple of 90 degrees using the Canvas API.
 * Non-image files and a 0 rotation pass through unchanged. Used to bake a
 * thumbnail's chosen rotation into the file before it goes into the PDF.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function rotateImage(file: File, degrees: number): Promise<File> {
  const angle = ((degrees % 360) + 360) % 360;
  if (angle === 0 || !file.type.startsWith('image/')) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const swap = angle === 90 || angle === 270;
    const canvas = document.createElement('canvas');
    canvas.width = swap ? img.naturalHeight : img.naturalWidth;
    canvas.height = swap ? img.naturalWidth : img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    return await new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type }) : file),
        type,
        0.9,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
