import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";
import { SystemNotification } from "@/types/lead";
import { syncState, saveState } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await syncState();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!serverState.systemNotifications) {
      serverState.systemNotifications = [];
    }

    // Filter notifications relevant to this user
    const filtered = serverState.systemNotifications.filter((n) => {
      if (role === "admin") {
        return n.recipientId === "admin" || n.recipientId === "all";
      }
      return n.recipientId === "all" || n.recipientId === userId;
    });

    return NextResponse.json({ notifications: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await syncState();
    const { action, payload } = await request.json();

    if (!serverState.systemNotifications) {
      serverState.systemNotifications = [];
    }

    if (action === "send") {
      const { recipientId, title, message, senderName } = payload;

      if (!recipientId || !title || !message) {
        return NextResponse.json({ error: "Missing notification contents" }, { status: 400 });
      }

      const newNotification: SystemNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        recipientId,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        senderName: senderName || "System"
      };

      serverState.systemNotifications.unshift(newNotification);
      await saveState("systemNotifications");
      return NextResponse.json({ success: true, notification: newNotification });
    }

    if (action === "markRead") {
      const { notificationId } = payload;
      const notif = serverState.systemNotifications.find(n => n.id === notificationId);
      if (notif) {
        notif.read = true;
      }
      await saveState("systemNotifications");
      return NextResponse.json({ success: true });
    }

    if (action === "markAllRead") {
      const { recipientId } = payload;
      const isAdmin = recipientId === "admin";
      
      serverState.systemNotifications.forEach((n) => {
        if (isAdmin) {
          if (n.recipientId === "admin" || n.recipientId === "all") {
            n.read = true;
          }
        } else {
          if (n.recipientId === recipientId || n.recipientId === "all") {
            n.read = true;
          }
        }
      });
      await saveState("systemNotifications");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process notification" }, { status: 500 });
  }
}
