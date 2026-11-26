import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getNotificationsForRecipient,
  markNotificationRead,
  syncAdminUntouchedNotifications,
  syncCallerEventNotifications,
} from "@/lib/notifications";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const recipientId = auth.user.role === "admin" ? "admin" : auth.user.id;

  try {
    if (auth.user.role === "admin") {
      await syncAdminUntouchedNotifications();
    } else {
      await syncCallerEventNotifications(auth.user.id);
    }
  } catch (err) {
    console.error("Notification sync warning:", err);
  }

  const data = await getNotificationsForRecipient(recipientId);
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const recipientId = auth.user.role === "admin" ? "admin" : auth.user.id;
  const body = await request.json();

  await markNotificationRead(
    recipientId,
    body.id ? String(body.id) : undefined,
    Boolean(body.markAll)
  );

  return NextResponse.json({ success: true });
}
