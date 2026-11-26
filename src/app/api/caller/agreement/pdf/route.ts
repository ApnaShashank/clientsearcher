import { NextResponse } from "next/server";
import { requireCaller } from "@/lib/auth";
import { generateSignedAgreementPdf } from "@/lib/agreementPdf";

export async function GET() {
  const auth = await requireCaller();
  if (auth.error) return auth.error;

  const pdfBytes = await generateSignedAgreementPdf(auth.user);
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="creightweb-agreement-${auth.user.username}.pdf"`,
    },
  });
}
