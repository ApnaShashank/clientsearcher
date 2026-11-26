import { NextRequest, NextResponse } from "next/server";
import { isCallerApproved, requireAdmin, requireAuth } from "@/lib/auth";
import {
  deletePricingRow,
  getAllPricingRows,
  getAppSettings,
  insertPricingRow,
  makeId,
  updateAppSettings,
  updatePricingRow,
} from "@/lib/repo";
import {
  DEFAULT_NEGOTIATION_RULES,
  DEFAULT_TRAINING_VIDEO_URL,
  PricingRow,
} from "@/types/crm";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  if (auth.user.role === "caller" && !isCallerApproved(auth.user)) {
    return NextResponse.json(
      { error: "Forbidden. Account pending verification." },
      { status: 403 }
    );
  }

  const [pricingRows, settings] = await Promise.all([
    getAllPricingRows(),
    getAppSettings(),
  ]);

  return NextResponse.json({
    pricingRows,
    trainingVideoUrl: settings.trainingVideoUrl || DEFAULT_TRAINING_VIDEO_URL,
    negotiationRules:
      settings.negotiationRules && settings.negotiationRules.length > 0
        ? settings.negotiationRules
        : DEFAULT_NEGOTIATION_RULES,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const category = String(body.category || "").trim();
    const packageName = String(body.packageName || "").trim();
    const priceMin = Number(body.priceMin || 0);
    const priceMax = Number(body.priceMax || 0);
    const domainIncluded = Boolean(body.domainIncluded);
    const domainNote = String(
      body.domainNote ||
        (domainIncluded
          ? "Yes — customised domain included"
          : "No — domain NAHI milega")
    ).trim();
    const note = String(body.note || "").trim();

    if (!category || !packageName || !priceMin || !priceMax) {
      return NextResponse.json(
        { error: "Category, package name, min price, and max price are required." },
        { status: 400 }
      );
    }

    const existing = await getAllPricingRows();
    const row: PricingRow = {
      id: makeId("price"),
      category,
      packageName,
      priceMin,
      priceMax,
      domainIncluded,
      domainNote,
      note,
      order: existing.length + 1,
    };

    await insertPricingRow(row);
    return NextResponse.json({ row }, { status: 201 });
  } catch (err) {
    console.error("Create pricing row error:", err);
    return NextResponse.json(
      { error: "Failed to add pricing row." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    // Update guide text/video settings if provided
    if (
      body.trainingVideoUrl !== undefined ||
      Array.isArray(body.negotiationRules)
    ) {
      const patch: {
        trainingVideoUrl?: string;
        negotiationRules?: string[];
      } = {};
      if (body.trainingVideoUrl !== undefined) {
        patch.trainingVideoUrl = String(body.trainingVideoUrl).trim();
      }
      if (Array.isArray(body.negotiationRules)) {
        patch.negotiationRules = body.negotiationRules
          .map((s: unknown) => String(s).trim())
          .filter(Boolean);
      }
      const settings = await updateAppSettings(patch);
      return NextResponse.json({ settings });
    }

    // Otherwise update a pricing row
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Row id is required" }, { status: 400 });
    }

    const patch: Partial<PricingRow> = {};
    if (body.category !== undefined) patch.category = String(body.category).trim();
    if (body.packageName !== undefined) patch.packageName = String(body.packageName).trim();
    if (body.priceMin !== undefined) patch.priceMin = Number(body.priceMin);
    if (body.priceMax !== undefined) patch.priceMax = Number(body.priceMax);
    if (body.domainIncluded !== undefined) {
      patch.domainIncluded = Boolean(body.domainIncluded);
    }
    if (body.domainNote !== undefined) patch.domainNote = String(body.domainNote).trim();
    if (body.note !== undefined) patch.note = String(body.note).trim();

    const updated = await updatePricingRow(id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Pricing row not found" }, { status: 404 });
    }
    return NextResponse.json({ row: updated });
  } catch (err) {
    console.error("Update guide error:", err);
    return NextResponse.json({ error: "Failed to update guide" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "Row id is required" }, { status: 400 });
  }
  const deleted = await deletePricingRow(id);
  if (!deleted) {
    return NextResponse.json({ error: "Row not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
