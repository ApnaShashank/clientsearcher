import { NextRequest, NextResponse } from "next/server";
import { findUserById, requireAdmin, toPublicUser } from "@/lib/auth";
import { generateSignedAgreementPdf } from "@/lib/agreementPdf";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const user = await findUserById(id);
  if (!user) {
    return NextResponse.json({ error: "Caller not found" }, { status: 404 });
  }

  const pdfBytes = await generateSignedAgreementPdf(toPublicUser(user));
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="creightweb-agreement-${user.username}.pdf"`,
    },
  });
}
