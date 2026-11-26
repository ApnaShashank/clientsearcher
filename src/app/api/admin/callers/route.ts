import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin, toPublicUser } from "@/lib/auth";
import {
  findUserByUsername,
  getAllCallLogs,
  getAllLeads,
  getAllUsers,
  insertUser,
  makeId,
} from "@/lib/repo";
import { logActivity } from "@/lib/activity";
import { User } from "@/types/crm";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const [users, leads, callLogs] = await Promise.all([
    getAllUsers(),
    getAllLeads(),
    getAllCallLogs(),
  ]);

  const callers = users
    .filter((u) => u.role === "caller")
    .map((u) => {
      const myLogs = callLogs.filter((c) => c.callerId === u.id);
      const myAssigned = leads.filter((l) => l.assignedTo === u.id);
      const interested = myLogs.filter(
        (c) =>
          c.outcome === "Interested" ||
          c.outcome === "Meeting Fixed" ||
          c.outcome === "Won"
      ).length;
      const won = myLogs.filter((c) => c.outcome === "Won").length;

      return {
        ...toPublicUser(u),
        stats: {
          totalAssigned: myAssigned.length,
          pendingQueue: myAssigned.filter((l) => l.status === "Assigned").length,
          totalCalls: myLogs.length,
          interested,
          won,
        },
      };
    });

  return NextResponse.json({ callers });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const phone = String(body.phone || "").trim();
    const homeCity = String(body.homeCity || "").trim();
    const workingAreas = Array.isArray(body.workingAreas)
      ? body.workingAreas.map((s: unknown) => String(s).trim()).filter(Boolean)
      : String(body.workingAreas || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const preferredCategories = Array.isArray(body.preferredCategories)
      ? body.preferredCategories.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];

    if (!name || !username || !password || !homeCity) {
      return NextResponse.json(
        { error: "Name, username, password, and home city are required." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters." },
        { status: 400 }
      );
    }

    const existing = await findUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { error: `Username "${username}" is already taken.` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newCaller: User = {
      id: makeId("caller"),
      name,
      username,
      passwordHash,
      role: "caller",
      phone,
      homeCity,
      workingAreas,
      preferredCategories,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await insertUser(newCaller);

    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: `Created caller "${newCaller.name}" (@${newCaller.username})`,
      entityType: "caller",
      entityId: newCaller.id,
    });

    return NextResponse.json({ caller: toPublicUser(newCaller) }, { status: 201 });
  } catch (err) {
    console.error("Create caller error:", err);
    return NextResponse.json(
      { error: "Failed to create caller." },
      { status: 500 }
    );
  }
}
