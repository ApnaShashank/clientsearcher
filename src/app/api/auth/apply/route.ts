import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByUsername, insertUser, makeId } from "@/lib/repo";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  toPublicUser,
} from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { User } from "@/types/crm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const phone = String(body.phone || "").trim();
    const whatsappNumber = String(body.whatsappNumber || phone).trim();
    const email = String(body.email || "").trim();
    const villageArea = String(body.villageArea || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const pinCode = String(body.pinCode || "").trim();
    const preferredCallCityArea = String(body.preferredCallCityArea || "").trim();
    const workExperience = String(body.workExperience || "").trim();
    const currentOccupation = String(body.currentOccupation || "").trim();
    const languagesSpoken = Array.isArray(body.languagesSpoken)
      ? body.languagesSpoken.map(String)
      : String(body.languagesSpoken || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const idProofType = body.idProofType === "PAN" ? "PAN" : "Aadhaar";
    const idProofNumber = String(body.idProofNumber || "").trim();

    if (
      !name ||
      !username ||
      !password ||
      !phone ||
      !city ||
      !idProofNumber
    ) {
      return NextResponse.json(
        {
          error:
            "Name, username, password, mobile number, city, and ID proof number are required.",
        },
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

    const fullAddress = [villageArea, city, state, pinCode]
      .filter(Boolean)
      .join(", ");

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: makeId("caller"),
      name,
      username,
      passwordHash,
      role: "caller",
      phone,
      whatsappNumber,
      email,
      homeCity: city,
      workingAreas: preferredCallCityArea ? [preferredCallCityArea] : [],
      preferredCategories: [],
      isActive: true,
      approvalStatus: "Pending",
      fullAddress,
      villageArea,
      city,
      state,
      pinCode,
      preferredCallCityArea,
      workExperience,
      currentOccupation,
      languagesSpoken,
      idProofType,
      idProofNumber,
      agreementSigned: false,
      createdAt: new Date().toISOString(),
    };

    await insertUser(newUser);

    await createNotification({
      recipientId: "admin",
      title: "New Caller Application",
      message: `${newUser.name} (@${newUser.username}) from ${newUser.city} registered and is proceeding to sign the agreement.`,
      type: "alert",
      entityId: newUser.id,
    });

    await logActivity({
      actorId: newUser.id,
      actorName: newUser.name,
      actorRole: "caller",
      action: `Registered via /apply (@${newUser.username}, ${newUser.city})`,
      entityType: "caller",
      entityId: newUser.id,
    });

    const token = await signSessionToken({
      userId: newUser.id,
      role: "caller",
    });

    const response = NextResponse.json(
      { user: toPublicUser(newUser) },
      { status: 201 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error("Apply error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
