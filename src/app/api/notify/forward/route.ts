import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";
import { syncState, saveState } from "@/lib/db";

// Extend server state with notifications if not initialized
if (!(serverState as any).notifications) {
  (serverState as any).notifications = [];
}

export async function POST(request: NextRequest) {
  try {
    await syncState();
    const { leadId, leadDetails, userEmail, userName, userId = "guest" } = await request.json();

    if (!leadDetails) {
      return NextResponse.json({ error: "Missing lead details" }, { status: 400 });
    }

    // 1. Simulating email transmission to developer console (real terminal check)
    const emailSubject = `[LocaLead Forward Alert] New Client Acquired!`;
    const emailBody = `
========================================
[EMAIL OUTBOX - DISPATCH TO shashank8808108802@gmail.com]
Subject: ${emailSubject}
----------------------------------------
Hello Admin,

A new client lead has been forwarded by a client hunt operator:
- Operator Name: ${userName}
- Operator Email: ${userEmail}
- Operator ID: ${userId}

--- CLIENT LEAD DETAILS ---
- Business Name: ${leadDetails.businessName}
- Industry Category: ${leadDetails.category}
- Location Address: ${leadDetails.address}
- Contact Number: ${leadDetails.phoneNumber || "None listed"}
- Email: ${leadDetails.email || "None listed"}
- Website: ${leadDetails.website || "None listed"}
- Lead Score: ${leadDetails.leadScore}/100

Please review the logs in the admin administration panel.
========================================
`;

    // Print to console (terminal logs check)
    console.log(emailBody);

    // 2. Add to serverState dynamic notifications list
    const notificationItem = {
      id: `notif_${Date.now()}`,
      leadId,
      businessName: leadDetails.businessName,
      category: leadDetails.category,
      userEmail,
      userName,
      timestamp: new Date().toISOString()
    };

    (serverState as any).notifications.unshift(notificationItem);

    // Keep last 100 alerts
    if ((serverState as any).notifications.length > 100) {
      (serverState as any).notifications = (serverState as any).notifications.slice(0, 100);
    }

    // 3. Add to serverState.forwardedLeads
    if (!serverState.forwardedLeads) {
      serverState.forwardedLeads = [];
    }
    const forwardedItem = {
      id: `fwd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      leadId,
      businessName: leadDetails.businessName,
      category: leadDetails.category,
      address: leadDetails.address,
      phoneNumber: leadDetails.phoneNumber || "",
      website: leadDetails.website || "",
      forwardedBy: userId,
      forwardedByName: userName,
      forwardedAt: new Date().toISOString(),
      status: "Under Review" as const,
      notes: "Newly forwarded lead from employee.",
      rewardAmount: 0
    };
    serverState.forwardedLeads.unshift(forwardedItem);

    // 4. Add system notification alert for admin dropdown
    if (!serverState.systemNotifications) {
      serverState.systemNotifications = [];
    }
    serverState.systemNotifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      recipientId: "admin",
      title: "New Lead Forwarded",
      message: `Employee "${userName}" forwarded lead "${leadDetails.businessName}" to admin review. Check Task board/dispatcher!`,
      timestamp: new Date().toISOString(),
      read: false,
      senderName: userName
    });

    // 5. Add to system activities audit logs
    serverState.activities.unshift({
      id: `act_${Date.now()}`,
      leadId,
      leadName: leadDetails.businessName,
      action: `Lead forwarded to shashank8808108802@gmail.com by ${userName} (${userEmail})`,
      timestamp: new Date().toISOString()
    });

    await saveState("notifications");
    await saveState("forwardedLeads");
    await saveState("systemNotifications");
    await saveState("activities");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Notify forward API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
