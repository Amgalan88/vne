"use client";

/**
 * Баримтын хуудсыг (A4) PDF файл болгон шууд татна — хэвлэх цонхгүйгээр.
 * Урьдчилан харах хэсэг жижигрүүлэгдсэн (zoom) байдаг тул эх хэмжээгээр нь хувилж, зураг болгоод A4-т хуваана.
 */
export async function downloadSheetPdf(container: HTMLElement, filename: string) {
  const sheet = container.querySelector<HTMLElement>(".sheet, .of-sheet");
  if (!sheet) throw new Error("Баримт олдсонгүй");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);

  // Жижигрүүлэлтгүй, дэлгэцийн гадна хувилна
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;background:#fff;zoom:1";
  const clone = sheet.cloneNode(true) as HTMLElement;
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "0";
  holder.appendChild(clone);
  document.body.appendChild(holder);
  try {
    // Зургууд ачаалагдахыг хүлээнэ
    await Promise.all(
      [...clone.querySelectorAll("img")].map(img => (img.complete ? null : new Promise(r => ((img.onload = r), (img.onerror = r))))),
    );
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    const pageW = 210;
    const pageH = 297;
    const imgH = (canvas.height * pageW) / canvas.width;
    const img = canvas.toDataURL("image/jpeg", 0.92);
    // Нэг хуудаснаас урт бол дараагийн хуудсанд үргэлжлүүлнэ
    let y = 0;
    pdf.addImage(img, "JPEG", 0, y, pageW, imgH);
    let left = imgH - pageH;
    while (left > 1) {
      y -= pageH;
      pdf.addPage();
      pdf.addImage(img, "JPEG", 0, y, pageW, imgH);
      left -= pageH;
    }
    pdf.save(filename.replace(/[\\/:*?"<>|]+/g, "-") + ".pdf");
  } finally {
    holder.remove();
  }
}
