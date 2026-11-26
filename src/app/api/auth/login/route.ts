import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByUsername } from "@/lib/repo";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  toPublicUser,
} from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Contact Admin." },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const token = await signSessionToken({ userId: user.id, role: user.role });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: `${user.role === "admin" ? "Admin" : "Caller"} logged in`,
      entityType: "auth",
      entityId: user.id,
    });

    const response = NextResponse.json({ user: toPublicUser(user) });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Authentication failed." },
      { status: 500 }
    );
  }
}
