import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";
import { syncState, saveState } from "@/lib/db";

export async function GET() {
  await syncState();
  const onlineCount = Math.max(1, Object.keys(serverState.onlineUsers).length);
  return NextResponse.json({
    users: serverState.users,
    searchLogs: serverState.searchLogs,
    activities: serverState.activities,
    onlineUsers: onlineCount,
    apiKeyUsage: serverState.apiKeyUsage,
    customApiKeys: serverState.customApiKeys,
    notifications: serverState.notifications || [],
    forwardedLeads: serverState.forwardedLeads || []
  });
}


export async function POST(request: NextRequest) {
  try {
    await syncState();
    const { action, payload } = await request.json();

    if (action === "updateKeys") {
      serverState.customApiKeys = {
        ...serverState.customApiKeys,
        ...payload
      };
      
      serverState.activities.unshift({
        id: `act_${Date.now()}`,
        leadId: "config",
        leadName: "System Settings",
        action: "Administrator updated customized API keys configuration",
        timestamp: new Date().toISOString()
      });

      await saveState("customApiKeys");
      await saveState("activities");
      return NextResponse.json({ success: true, customApiKeys: serverState.customApiKeys });
    }

    if (action === "updateUserPlan") {
      const { userId, plan } = payload;
      serverState.users = serverState.users.map(u => 
        u.id === userId ? { ...u, plan } : u
      );
      await saveState("users");
      return NextResponse.json({ success: true });
    }

    if (action === "updateUserProfile") {
      const { userId, name, password } = payload;
      serverState.users = serverState.users.map(u => 
        u.id === userId ? { ...u, name, ...(password ? { password } : {}) } : u
      );
      
      serverState.activities.unshift({
        id: `act_${Date.now()}`,
        leadId: "profile",
        leadName: "User Profile Settings",
        action: `User "${name}" updated their profile settings${password ? " (including password)" : ""}`,
        timestamp: new Date().toISOString()
      });
      
      await saveState("users");
      await saveState("activities");
      return NextResponse.json({ success: true });
    }

    if (action === "toggleBanUser") {
      const { userId } = payload;
      serverState.users = serverState.users.map(u => 
        u.id === userId ? { ...u, isBanned: !u.isBanned } : u
      );
      await saveState("users");
      return NextResponse.json({ success: true });
    }

    if (action === "deleteUser") {
      const { userId } = payload;
      serverState.users = serverState.users.filter(u => u.id !== userId);
      await saveState("users");
      return NextResponse.json({ success: true });
    }

    if (action === "updateForwardedLeadStatus") {
      const { leadId, status, notes } = payload;
      if (!serverState.forwardedLeads) {
        serverState.forwardedLeads = [];
      }
      const item = serverState.forwardedLeads.find(l => l.id === leadId);
      if (item) {
        const oldStatus = item.status;
        item.status = status;
        if (notes !== undefined) item.notes = notes;

        if (status === "Approved" && oldStatus !== "Approved") {
          item.rewardAmount = 500;
          
          // Find user who forwarded it (match by email/username)
          const user = serverState.users.find(u => u.email.toLowerCase() === item.forwardedBy.toLowerCase() || u.id === item.forwardedBy);
          if (user) {
            user.pendingEarnings = (user.pendingEarnings || 0) + 500;
            user.totalEarnings = (user.totalEarnings || 0) + 500;
            user.withdrawalStatus = "None";

            if (!serverState.systemNotifications) {
              serverState.systemNotifications = [];
            }
            serverState.systemNotifications.unshift({
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              recipientId: user.id,
              title: "Lead Approved! 💰 Won 500 Rs",
              message: `Congratulations! Your forwarded lead "${item.businessName}" was approved. 500 Rs added to your balance.`,
              timestamp: new Date().toISOString(),
              read: false,
              senderName: "System Administrator"
            });
          }
        }

        serverState.activities.unshift({
          id: `act_${Date.now()}`,
          leadId: item.leadId,
          leadName: item.businessName,
          action: `Forwarded lead status updated to "${status}" by Administrator`,
          timestamp: new Date().toISOString()
        });
      }
      await saveState("forwardedLeads");
      await saveState("users");
      await saveState("systemNotifications");
      await saveState("activities");
      return NextResponse.json({ success: true, forwardedLeads: serverState.forwardedLeads });
    }

    if (action === "submitWithdrawalRequest") {
      const { userId, qrCodeUrl } = payload;
      serverState.users = serverState.users.map(u => {
        if (u.id === userId) {
          // Send admin notification
          if (!serverState.systemNotifications) {
            serverState.systemNotifications = [];
          }
          serverState.systemNotifications.unshift({
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            recipientId: "admin",
            title: "Withdrawal Requested",
            message: `User "${u.name}" requested withdrawal of pending earnings (${u.pendingEarnings || 500} Rs). QR Code uploaded.`,
            timestamp: new Date().toISOString(),
            read: false,
            senderName: u.name
          });

          serverState.activities.unshift({
            id: `act_${Date.now()}`,
            leadId: "withdrawal",
            leadName: `Withdrawal Request: ${u.name}`,
            action: `User requested withdrawal of ${u.pendingEarnings || 500} Rs. QR code uploaded.`,
            timestamp: new Date().toISOString()
          });

          return {
            ...u,
            withdrawalStatus: "Pending" as const,
            qrCodeUrl
          };
        }
        return u;
      });

      // Synchronize currentUser back if active
      await saveState("users");
      await saveState("systemNotifications");
      await saveState("activities");
      return NextResponse.json({ success: true, users: serverState.users });
    }

    if (action === "approveWithdrawal") {
      const { userId, paymentReceiptUrl } = payload;
      serverState.users = serverState.users.map(u => {
        if (u.id === userId) {
          const amountPaid = u.pendingEarnings || 0;
          
          if (!serverState.systemNotifications) {
            serverState.systemNotifications = [];
          }
          serverState.systemNotifications.unshift({
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            recipientId: u.id,
            title: "Withdrawal Approved! 🎉 Paid",
            message: `Your withdrawal of ${amountPaid || 500} Rs has been approved and paid manually. Screenshot details available.`,
            timestamp: new Date().toISOString(),
            read: false,
            senderName: "System Administrator"
          });

          serverState.activities.unshift({
            id: `act_${Date.now()}`,
            leadId: "withdrawal",
            leadName: `Withdrawal Approved: ${u.name}`,
            action: `Administrator approved withdrawal of ${amountPaid || 500} Rs for user ${u.name}.`,
            timestamp: new Date().toISOString()
          });

          return {
            ...u,
            pendingEarnings: 0,
            withdrawalStatus: "Paid" as const,
            paymentReceiptUrl
          };
        }
        return u;
      });

      await saveState("users");
      await saveState("systemNotifications");
      await saveState("activities");
      return NextResponse.json({ success: true, users: serverState.users });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
