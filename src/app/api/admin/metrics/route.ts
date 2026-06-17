import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";

export async function GET() {
  const onlineCount = Math.max(1, Object.keys(serverState.onlineUsers).length);
  return NextResponse.json({
    users: serverState.users,
    searchLogs: serverState.searchLogs,
    activities: serverState.activities,
    onlineUsers: onlineCount,
    apiKeyUsage: serverState.apiKeyUsage,
    customApiKeys: serverState.customApiKeys,
    notifications: serverState.notifications || []
  });
}


export async function POST(request: NextRequest) {
  try {
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

      return NextResponse.json({ success: true, customApiKeys: serverState.customApiKeys });
    }

    if (action === "updateUserPlan") {
      const { userId, plan } = payload;
      serverState.users = serverState.users.map(u => 
        u.id === userId ? { ...u, plan } : u
      );
      return NextResponse.json({ success: true });
    }

    if (action === "toggleBanUser") {
      const { userId } = payload;
      serverState.users = serverState.users.map(u => 
        u.id === userId ? { ...u, isBanned: !u.isBanned } : u
      );
      return NextResponse.json({ success: true });
    }

    if (action === "deleteUser") {
      const { userId } = payload;
      serverState.users = serverState.users.filter(u => u.id !== userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
