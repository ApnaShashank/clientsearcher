import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";

export async function POST(request: NextRequest) {
  try {
    const { leadId, leadName, action } = await request.json();
    
    serverState.activities.unshift({
      id: `act_${Date.now()}`,
      leadId: leadId || "unknown",
      leadName: leadName || "System Event",
      action: action || "",
      timestamp: new Date().toISOString()
    });

    // Truncate to last 100 to save memory
    if (serverState.activities.length > 100) {
      serverState.activities = serverState.activities.slice(0, 100);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
