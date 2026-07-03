/**
 * Combine one or more image Files into a single multi-page A4 PDF.
 *
 * Each image becomes one page, scaled to fit within the page margins while
 * preserving its aspect ratio and centred. Used to turn several photos of a
 * multi-page tax document into one document. Images should already be
 * compressed (see imageCompression.ts) before being passed in.
 */
import jsPDF from 'jspdf';

const MARGIN_PT = 24;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function imagesToPdf(files: File[], filename: string): Promise<File> {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < files.length; i += 1) {
    const dataUrl = await readAsDataUrl(files[i]);
    const { w, h } = await imageSize(dataUrl);
    const scale = Math.min((pageW - MARGIN_PT * 2) / w, (pageH - MARGIN_PT * 2) / h);
    const drawW = w * scale;
    const drawH = h * scale;
    if (i > 0) pdf.addPage();
    const format = files[i].type === 'image/png' ? 'PNG' : 'JPEG';
    pdf.addImage(dataUrl, format, (pageW - drawW) / 2, (pageH - drawH) / 2, drawW, drawH);
  }

  return new File([pdf.output('blob')], filename, { type: 'application/pdf' });
}
