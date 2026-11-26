import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface ReportPdfRow {
  businessName: string;
  phoneMasked: string;
  outcome: string;
  note: string;
  calledAt: string;
  callerName?: string;
}

export interface ReportPdfOptions {
  title: string;
  subtitle: string;
  dateRangeLabel: string;
  generatedBy: string;
  summaryStats: { label: string; value: string | number }[];
  rows: ReportPdfRow[];
  includeCallerColumn?: boolean;
}

function sanitizeAscii(text: string): string {
  // Standard pdf-lib Helvetica supports WinAnsi; strip non-WinAnsi emojis/symbols safely
  return String(text || "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateBrandedPdf(
  opts: ReportPdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const orange = rgb(1, 0.36, 0.11); // #FF5C1C
  const dark = rgb(0.07, 0.07, 0.07); // #111111
  const muted = rgb(0.45, 0.45, 0.45);
  const lightBg = rgb(0.96, 0.96, 0.95);
  const borderCol = rgb(0.88, 0.88, 0.87);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawHeader = () => {
    // Brand bar
    page.drawRectangle({
      x: margin,
      y: y - 42,
      width: contentWidth,
      height: 46,
      color: dark,
    });
    page.drawRectangle({
      x: margin,
      y: y - 42,
      width: 6,
      height: 46,
      color: orange,
    });
    page.drawText("CREIGHTWEB", {
      x: margin + 16,
      y: y - 20,
      size: 13,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText(sanitizeAscii(opts.title), {
      x: margin + 16,
      y: y - 34,
      size: 9,
      font: fontRegular,
      color: rgb(0.8, 0.8, 0.8),
    });
    page.drawText(sanitizeAscii(opts.dateRangeLabel), {
      x: pageWidth - margin - 170,
      y: y - 27,
      size: 9,
      font: fontBold,
      color: orange,
    });
    y -= 60;

    page.drawText(sanitizeAscii(opts.subtitle), {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: dark,
    });
    page.drawText(
      sanitizeAscii(`Generated: ${new Date().toLocaleString("en-IN")} | By: ${opts.generatedBy}`),
      {
        x: margin,
        y: y - 14,
        size: 8.5,
        font: fontRegular,
        color: muted,
      }
    );
    y -= 32;
  };

  drawHeader();

  // Summary boxes
  const statCount = Math.min(opts.summaryStats.length, 4);
  if (statCount > 0) {
    const boxGap = 8;
    const boxW = (contentWidth - boxGap * (statCount - 1)) / statCount;
    opts.summaryStats.slice(0, 4).forEach((st, idx) => {
      const bx = margin + idx * (boxW + boxGap);
      page.drawRectangle({
        x: bx,
        y: y - 42,
        width: boxW,
        height: 42,
        color: lightBg,
        borderColor: borderCol,
        borderWidth: 1,
      });
      page.drawText(sanitizeAscii(String(st.value)), {
        x: bx + 10,
        y: y - 20,
        size: 15,
        font: fontBold,
        color: idx === 0 ? orange : dark,
      });
      page.drawText(sanitizeAscii(st.label), {
        x: bx + 10,
        y: y - 34,
        size: 8,
        font: fontRegular,
        color: muted,
      });
    });
    y -= 58;
  }

  // Table header
  const drawTableHeader = () => {
    page.drawRectangle({
      x: margin,
      y: y - 20,
      width: contentWidth,
      height: 20,
      color: dark,
    });
    page.drawText("Business", {
      x: margin + 6,
      y: y - 13,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText("Phone", {
      x: margin + 165,
      y: y - 13,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    if (opts.includeCallerColumn) {
      page.drawText("Caller", {
        x: margin + 235,
        y: y - 13,
        size: 8.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    }
    page.drawText("Outcome", {
      x: margin + (opts.includeCallerColumn ? 315 : 240),
      y: y - 13,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText("Note", {
      x: margin + (opts.includeCallerColumn ? 395 : 330),
      y: y - 13,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    y -= 24;
  };

  drawTableHeader();

  if (opts.rows.length === 0) {
    page.drawText("No call records for the selected period.", {
      x: margin + 6,
      y: y - 14,
      size: 9.5,
      font: fontRegular,
      color: muted,
    });
  } else {
    for (let i = 0; i < opts.rows.length; i++) {
      const row = opts.rows[i];
      if (y < margin + 35) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
        drawTableHeader();
      }

      if (i % 2 === 1) {
        page.drawRectangle({
          x: margin,
          y: y - 16,
          width: contentWidth,
          height: 18,
          color: lightBg,
        });
      }

      const biz = sanitizeAscii(row.businessName).slice(0, 28);
      const ph = sanitizeAscii(row.phoneMasked).slice(0, 14);
      const outcome = sanitizeAscii(row.outcome).slice(0, 15);
      const noteMax = opts.includeCallerColumn ? 22 : 34;
      const note = sanitizeAscii(row.note || "-").slice(0, noteMax);

      page.drawText(biz, {
        x: margin + 6,
        y: y - 11,
        size: 8.5,
        font: fontRegular,
        color: dark,
      });
      page.drawText(ph, {
        x: margin + 165,
        y: y - 11,
        size: 8.5,
        font: fontRegular,
        color: muted,
      });
      if (opts.includeCallerColumn) {
        page.drawText(sanitizeAscii(row.callerName || "-").slice(0, 14), {
          x: margin + 235,
          y: y - 11,
          size: 8.5,
          font: fontRegular,
          color: dark,
        });
      }
      page.drawText(outcome, {
        x: margin + (opts.includeCallerColumn ? 315 : 240),
        y: y - 11,
        size: 8.5,
        font: fontBold,
        color: outcome === "Won" || outcome === "Interested" ? orange : dark,
      });
      page.drawText(note, {
        x: margin + (opts.includeCallerColumn ? 395 : 330),
        y: y - 11,
        size: 8,
        font: fontRegular,
        color: muted,
      });

      y -= 18;
    }
  }

  return pdfDoc.save();
}
