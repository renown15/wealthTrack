import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportScenarioPdf(
  element: HTMLElement,
  scenarioName: string,
  fileName: string,
): Promise<void> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const margin = 10;
  pdf.setFontSize(14);
  pdf.setTextColor(30, 27, 75);
  pdf.text(scenarioName, margin, margin + 4);
  const contentY = margin + 10;
  const maxW = pdf.internal.pageSize.getWidth() - margin * 2;
  const maxH = pdf.internal.pageSize.getHeight() - contentY - margin;
  const ratio = canvas.height / canvas.width;
  const imgW = ratio < maxH / maxW ? maxW : maxH / ratio;
  const imgH = imgW * ratio;
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, contentY, imgW, imgH);
  pdf.save(fileName);
}
