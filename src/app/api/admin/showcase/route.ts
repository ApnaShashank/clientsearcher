import { NextRequest, NextResponse } from "next/server";
import { isCallerApproved, requireAdmin, requireAuth } from "@/lib/auth";
import {
  deleteShowcaseItem,
  getAllShowcase,
  insertShowcaseItem,
  makeId,
  updateShowcaseItem,
} from "@/lib/repo";
import { logActivity } from "@/lib/activity";
import { ShowcaseItem } from "@/types/crm";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  if (auth.user.role === "caller" && !isCallerApproved(auth.user)) {
    return NextResponse.json(
      { error: "Forbidden. Account pending verification." },
      { status: 403 }
    );
  }

  const items = await getAllShowcase();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const businessName = String(body.businessName || "").trim();
    const category = String(body.category || "").trim();
    const liveUrl = String(body.liveUrl || "").trim();
    const previewImage = String(body.previewImage || "").trim();
    const logoImage = String(body.logoImage || "").trim();
    const type = body.type === "demo" ? "demo" : "client";

    if (!title || !businessName || !liveUrl) {
      return NextResponse.json(
        { error: "Title, business name, and live URL are required." },
        { status: 400 }
      );
    }

    const item: ShowcaseItem = {
      id: makeId("work"),
      title,
      businessName,
      category: category || "Website",
      liveUrl,
      previewImage,
      logoImage: logoImage || undefined,
      type,
      createdAt: new Date().toISOString(),
    };

    await insertShowcaseItem(item);
    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: `Added showcase item "${item.businessName}"`,
      entityType: "settings",
      entityId: item.id,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("Showcase create error:", err);
    return NextResponse.json(
      { error: "Failed to add showcase item." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Item id is required" }, { status: 400 });
    }
    const patch: Partial<ShowcaseItem> = {};
    for (const k of [
      "title",
      "businessName",
      "category",
      "liveUrl",
      "previewImage",
      "logoImage",
      "type",
    ] as const) {
      if (body[k] !== undefined) {
        patch[k] = body[k];
      }
    }
    const updated = await updateShowcaseItem(id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error("Showcase update error:", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "Item id is required" }, { status: 400 });
  }
  const deleted = await deleteShowcaseItem(id);
  if (!deleted) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
