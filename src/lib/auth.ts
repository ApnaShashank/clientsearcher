import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { PublicUser, User } from "@/types/crm";
import { getCollection, stripMongoId } from "./db";

export const SESSION_COOKIE_NAME = "creightweb_session";

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "creightweb-calling-crm-dev-secret-change-in-prod";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  role: "admin" | "caller";
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.userId === "string" &&
      (payload.role === "admin" || payload.role === "caller")
    ) {
      return { userId: payload.userId, role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _pw, ...pub } = user;
  return pub;
}

export async function findUserById(userId: string): Promise<User | null> {
  const { col, memory } = await getCollection<User>("users");
  if (col) {
    const doc = await col.findOne({ id: userId });
    return doc ? (stripMongoId(doc) as User) : null;
  }
  return memory.users.find((u) => u.id === userId) || null;
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await findUserById(payload.userId);
  if (!user || !user.isActive) {
    return null;
  }

  return toPublicUser(user);
}

export async function requireAuth(): Promise<
  | { user: PublicUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export async function requireAdmin(): Promise<
  | { user: PublicUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const res = await requireAuth();
  if (res.error) return res;
  if (res.user.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      ),
    };
  }
  return { user: res.user };
}

export function isCallerApproved(user: Pick<PublicUser, "approvalStatus">): boolean {
  // Existing callers created before Phase 7 have undefined approvalStatus -> Approved
  return !user.approvalStatus || user.approvalStatus === "Approved";
}

export async function requireCaller(): Promise<
  | { user: PublicUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const res = await requireAuth();
  if (res.error) return res;
  if (res.user.role !== "caller") {
    return {
      error: NextResponse.json(
        { error: "Forbidden. Caller access required." },
        { status: 403 }
      ),
    };
  }
  return { user: res.user };
}

export async function requireApprovedCaller(): Promise<
  | { user: PublicUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const res = await requireCaller();
  if (res.error) return res;
  if (!isCallerApproved(res.user)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden. Your account is pending verification." },
        { status: 403 }
      ),
    };
  }
  return { user: res.user };
}
