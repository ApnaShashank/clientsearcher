import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PublicUser } from "@/types/crm";

export const AGREEMENT_CLAUSES = [
  {
    title: "1. Role & Daily Responsibility",
    en: "The caller will call assigned businesses from the Creightweb app and honestly update every call's outcome.",
    hi: "Hindi: App me diye gaye businesses ko call karna aur har call ka sahi outcome update karna.",
  },
  {
    title: "2. Salary & Performance Incentives",
    en: "Monthly salary is Rs. 15,000 - Rs. 20,000 based on role/experience, plus performance incentives for interested leads, meetings, and closed clients.",
    hi: "Hindi: Role aur experience ke hisab se Rs. 15,000-20,000 mahina salary + ache kaam par extra incentive.",
  },
  {
    title: "3. Zero Cash / Payment Collection Policy",
    en: "The caller will NEVER collect any money, advance, or payment from any client. All payments go directly to Creightweb (Shashank Gupta). Taking money from a client is fraud and ends the agreement immediately.",
    hi: "Hindi: Client se kabhi bhi koi paisa ya advance nahi lena hai. Saara payment seedha Creightweb ko hoga.",
  },
  {
    title: "4. Data Confidentiality & Ownership",
    en: "All lead data is Creightweb's property. The caller must never share, sell, copy, or use it for personal or third-party work during or after the association.",
    hi: "Hindi: Leads aur client data Creightweb ki property hai — isse kabhi kisi ke saath share ya use nahi karna hai.",
  },
  {
    title: "5. Daily Honesty & Reporting",
    en: "Only genuine call outcomes may be logged — no fake updates. The daily report must be submitted as required.",
    hi: "Hindi: Sirf sach aur asli call updates daalne hain; koi fake entry nahi aur roz report deni hai.",
  },
  {
    title: "6. Termination & Notice",
    en: "Creightweb may end the association anytime for fraud, data misuse, or repeated absence; the caller may leave with prior notice.",
    hi: "Hindi: Fraud, data misuse ya lagatar absence par Creightweb agreement khatam kar sakta hai; caller notice dekar chhod sakta hai.",
  },
];

function cleanAscii(str: string): string {
  return String(str || "")
    .replace(/₹/g, "Rs. ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateSignedAgreementPdf(
  user: PublicUser
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const orange = rgb(1, 0.36, 0.11);
  const dark = rgb(0.07, 0.07, 0.07);
  const muted = rgb(0.42, 0.42, 0.42);
  const lightBg = rgb(0.96, 0.96, 0.95);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header
  page.drawRectangle({
    x: margin,
    y: y - 44,
    width: contentWidth,
    height: 48,
    color: dark,
  });
  page.drawRectangle({
    x: margin,
    y: y - 44,
    width: 6,
    height: 48,
    color: orange,
  });
  page.drawText("CREIGHTWEB CALLER AGREEMENT", {
    x: margin + 16,
    y: y - 20,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Digitally Signed Telecaller Onboarding & Verification Record", {
    x: margin + 16,
    y: y - 35,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.82, 0.82, 0.82),
  });
  y -= 62;

  // Caller Profile Box
  page.drawRectangle({
    x: margin,
    y: y - 108,
    width: contentWidth,
    height: 112,
    color: lightBg,
  });

  const profileLines = [
    `Full Name: ${cleanAscii(user.name)}   |   Username: @${cleanAscii(user.username)}`,
    `Mobile: ${cleanAscii(user.phone)}   |   WhatsApp: ${cleanAscii(user.whatsappNumber || user.phone)}   |   Email: ${cleanAscii(user.email || "-")}`,
    `Address: ${cleanAscii(user.fullAddress || `${user.villageArea || ""}, ${user.city || ""}, ${user.state || ""} - ${user.pinCode || ""}`)}`,
    `Calling City/Area: ${cleanAscii(user.preferredCallCityArea || user.homeCity)}   |   Languages: ${cleanAscii((user.languagesSpoken || []).join(", ") || "-")}`,
    `Occupation: ${cleanAscii(user.currentOccupation || "-")}   |   Experience: ${cleanAscii(user.workExperience || "-")}`,
    `ID Proof: ${cleanAscii(user.idProofType || "-")} (${cleanAscii(user.idProofNumber || "-")})`,
  ];

  let py = y - 16;
  for (const line of profileLines) {
    page.drawText(line.slice(0, 95), {
      x: margin + 10,
      y: py,
      size: 8.5,
      font: fontRegular,
      color: dark,
    });
    py -= 16;
  }
  y -= 126;

  // Clauses
  const wrapText = (text: string, maxChars: number): string[] => {
    const words = cleanAscii(text).split(" ");
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      if ((current + " " + w).trim().length > maxChars) {
        if (current) lines.push(current);
        current = w;
      } else {
        current = (current + " " + w).trim();
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  for (const clause of AGREEMENT_CLAUSES) {
    if (y < margin + 120) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(cleanAscii(clause.title), {
      x: margin,
      y,
      size: 9.5,
      font: fontBold,
      color: dark,
    });
    y -= 13;

    for (const line of wrapText(clause.en, 92)) {
      page.drawText(line, {
        x: margin + 8,
        y,
        size: 8.5,
        font: fontRegular,
        color: dark,
      });
      y -= 11.5;
    }
    for (const line of wrapText(clause.hi, 94)) {
      page.drawText(line, {
        x: margin + 8,
        y,
        size: 8,
        font: fontRegular,
        color: muted,
      });
      y -= 11;
    }
    y -= 6;
  }

  // Signature Section
  if (y < margin + 110) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }
  y -= 8;
  page.drawRectangle({
    x: margin,
    y: y - 92,
    width: contentWidth,
    height: 94,
    color: lightBg,
  });

  page.drawText("DIGITAL SIGNATURE & VERIFICATION STAMP", {
    x: margin + 12,
    y: y - 16,
    size: 9,
    font: fontBold,
    color: orange,
  });
  page.drawText(
    `Signed By: ${cleanAscii(user.signedFullName || user.name)}`,
    {
      x: margin + 12,
      y: y - 34,
      size: 9,
      font: fontBold,
      color: dark,
    }
  );
  page.drawText(
    `Signed At: ${user.agreementSignedAt ? new Date(user.agreementSignedAt).toLocaleString("en-IN") : "Pending"}`,
    {
      x: margin + 12,
      y: y - 50,
      size: 8.5,
      font: fontRegular,
      color: muted,
    }
  );
  page.drawText(
    `Status: ${cleanAscii(user.approvalStatus || "Pending")}`,
    {
      x: margin + 12,
      y: y - 66,
      size: 8.5,
      font: fontBold,
      color: dark,
    }
  );

  // Embed signature PNG if available
  if (user.signatureDataUrl && user.signatureDataUrl.startsWith("data:image/png;base64,")) {
    try {
      const b64 = user.signatureDataUrl.replace("data:image/png;base64,", "");
      const pngImage = await pdfDoc.embedPng(Buffer.from(b64, "base64"));
      page.drawImage(pngImage, {
        x: pageWidth - margin - 175,
        y: y - 82,
        width: 160,
        height: 64,
      });
    } catch (err) {
      console.error("Could not embed signature PNG:", err);
    }
  }

  return pdfDoc.save();
}
