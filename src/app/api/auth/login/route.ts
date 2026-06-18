import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const adminEmailEnv = process.env.ADMIN_EMAIL || "admin@localead";
    const adminPasswordEnv = process.env.ADMIN_PASSWORD || "locallead14062026";

    // Verify if admin credentials match
    if (email.toLowerCase() === adminEmailEnv.toLowerCase() && password === adminPasswordEnv) {
      // Find admin user in server state or create
      let adminUser = serverState.users.find(u => u.email.toLowerCase() === adminEmailEnv.toLowerCase());
      if (!adminUser) {
        adminUser = {
          id: "admin_1",
          name: name || "Localead Admin",
          email: adminEmailEnv,
          role: "admin",
          plan: "Enterprise",
          isBanned: false,
          joinedAt: new Date().toISOString().split("T")[0]
        };
        serverState.users.push(adminUser);
      }

      // Add audit log
      serverState.activities.unshift({
        id: `act_${Date.now()}`,
        leadId: "auth",
        leadName: "System Auth Gate",
        action: `Administrator logged in successfully`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ user: adminUser });
    }

    // Regular users: checks or creates user
    let user = serverState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `user_${Date.now()}`,
        name: name || email.split("@")[0].toUpperCase(),
        email: email,
        role: "user",
        plan: "Free",
        isBanned: false,
        joinedAt: new Date().toISOString().split("T")[0]
      };
      serverState.users.push(user);
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "This user account is suspended or banned." }, { status: 403 });
    }

    // Add audit log
    serverState.activities.unshift({
      id: `act_${Date.now()}`,
      leadId: "auth",
      leadName: "System Auth Gate",
      action: `User "${email}" logged in`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("Login API route error:", err);
    return NextResponse.json({ error: err.message || "Failed to authenticate" }, { status: 500 });
  }
}
