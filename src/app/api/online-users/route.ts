import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";

// Clean up sessions older than 12 seconds
function cleanupSessions() {
  const now = Date.now();
  const cutoff = now - 12000; // 12 seconds timeout
  
  for (const [sid, timestamp] of Object.entries(serverState.onlineUsers)) {
    if (timestamp < cutoff) {
      delete serverState.onlineUsers[sid];
    }
  }
}

export async function GET() {
  cleanupSessions();
  
  // Always return at least 1 (the current user) or the actual active session count
  const count = Math.max(1, Object.keys(serverState.onlineUsers).length);
  return NextResponse.json({ count });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (sessionId) {
      serverState.onlineUsers[sessionId] = Date.now();
    }
    cleanupSessions();
    const count = Math.max(1, Object.keys(serverState.onlineUsers).length);
    return NextResponse.json({ count });
  } catch (err) {
    return NextResponse.json({ count: 1 });
  }
}
