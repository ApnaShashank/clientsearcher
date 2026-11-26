import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserById, requireAdmin, toPublicUser } from "@/lib/auth";
import { updateUser } from "@/lib/repo";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const caller = await findUserById(id);
  if (!caller || caller.role !== "caller") {
    return NextResponse.json({ error: "Caller not found" }, { status: 404 });
  }

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  const actions: string[] = [];

  if (typeof body.isActive === "boolean") {
    patch.isActive = body.isActive;
    actions.push(body.isActive ? "activated" : "deactivated");
  }

  if (
    body.approvalStatus === "Approved" ||
    body.approvalStatus === "Rejected" ||
    body.approvalStatus === "Pending"
  ) {
    patch.approvalStatus = body.approvalStatus;
    actions.push(`marked ${body.approvalStatus}`);
    if (body.rejectionReason !== undefined) {
      patch.rejectionReason = String(body.rejectionReason).trim();
    }
  }

  if (typeof body.newPassword === "string" && body.newPassword.trim().length >= 4) {
    patch.passwordHash = await bcrypt.hash(body.newPassword.trim(), 10);
    actions.push("reset password");
  }

  if (typeof body.name === "string" && body.name.trim()) {
    patch.name = body.name.trim();
  }
  if (typeof body.phone === "string") {
    patch.phone = body.phone.trim();
  }
  if (typeof body.homeCity === "string" && body.homeCity.trim()) {
    patch.homeCity = body.homeCity.trim();
  }
  if (Array.isArray(body.workingAreas)) {
    patch.workingAreas = body.workingAreas;
  }
  if (Array.isArray(body.preferredCategories)) {
    patch.preferredCategories = body.preferredCategories;
  }

  const updated = await updateUser(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Failed to update caller" }, { status: 500 });
  }

  if (body.approvalStatus === "Approved") {
    await createNotification({
      recipientId: id,
      title: "Account Approved!",
      message:
        "Welcome to Creightweb! Your account is now verified and approved. You can start calling leads.",
      type: "alert",
      entityId: id,
    });
  } else if (body.approvalStatus === "Rejected") {
    await createNotification({
      recipientId: id,
      title: "Application Not Approved",
      message:
        body.rejectionReason ||
        "Your application was not approved. Please contact Creightweb on WhatsApp.",
      type: "alert",
      entityId: id,
    });
  }

  await logActivity({
    actorId: auth.user.id,
    actorName: auth.user.name,
    actorRole: "admin",
    action: `${actions.length ? actions.join(" & ") : "Updated"} caller "${caller.name}"`,
    entityType: "caller",
    entityId: id,
  });

  return NextResponse.json({ caller: toPublicUser(updated) });
}
