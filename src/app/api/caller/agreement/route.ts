import { NextRequest, NextResponse } from "next/server";
import { requireCaller, toPublicUser } from "@/lib/auth";
import { updateUser } from "@/lib/repo";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  const auth = await requireCaller();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const signedFullName = String(body.signedFullName || "").trim();
    const signatureDataUrl = String(body.signatureDataUrl || "").trim();

    if (!signedFullName || !signatureDataUrl.startsWith("data:image/png;base64,")) {
      return NextResponse.json(
        { error: "Please draw your signature and type your full name." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updated = await updateUser(auth.user.id, {
      agreementSigned: true,
      agreementSignedAt: now,
      signedFullName,
      signatureDataUrl,
      approvalStatus: auth.user.approvalStatus || "Pending",
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await createNotification({
      recipientId: "admin",
      title: "Signed Agreement Submitted",
      message: `${updated.name} (@${updated.username}) signed the Creightweb Caller Agreement and is awaiting approval.`,
      type: "alert",
      entityId: updated.id,
    });

    await logActivity({
      actorId: updated.id,
      actorName: updated.name,
      actorRole: "caller",
      action: "Digitally signed Creightweb Caller Agreement",
      entityType: "caller",
      entityId: updated.id,
    });

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (err) {
    console.error("Agreement sign error:", err);
    return NextResponse.json(
      { error: "Failed to save agreement." },
      { status: 500 }
    );
  }
}
