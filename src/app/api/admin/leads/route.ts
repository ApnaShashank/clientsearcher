import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollection, stripMongoId } from "@/lib/db";
import { getLeadByPhone, insertLeads, makeId } from "@/lib/repo";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { logActivity } from "@/lib/activity";
import { Lead } from "@/types/crm";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() || "";
  const area = searchParams.get("area")?.trim().toLowerCase() || "";
  const category = searchParams.get("category")?.trim() || "";
  const websiteStatus = searchParams.get("websiteStatus")?.trim() || "";
  const service = searchParams.get("service")?.trim() || "";
  const priority = searchParams.get("priority")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const assignedFilter = searchParams.get("assigned")?.trim() || "";
  const q = searchParams.get("q")?.trim() || "";

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 25)));

  const { col, memory } = await getCollection<Lead>("leads");

  if (col) {
    const query: Record<string, unknown> = {};
    if (city) query.city = city;
    if (area) query.area = { $regex: area, $options: "i" };
    if (category) query.category = category;
    if (websiteStatus) query.websiteStatus = websiteStatus;
    if (service) query.servicesToPitch = service;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (assignedFilter === "unassigned") query.status = "Unassigned";
    if (assignedFilter === "assigned") query.assignedTo = { $ne: null };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { businessName: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
        { ownerName: { $regex: escaped, $options: "i" } },
        { area: { $regex: escaped, $options: "i" } },
        { city: { $regex: escaped, $options: "i" } },
      ];
    }

    const [total, docs] = await Promise.all([
      col.countDocuments(query),
      col
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);

    return NextResponse.json({
      leads: docs.map((d) => stripMongoId(d) as Lead),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }

  // In-memory fallback
  const qLower = q.toLowerCase();
  const filtered = memory.leads
    .filter((l) => {
      if (city && l.city !== city) return false;
      if (area && !l.area.toLowerCase().includes(area)) return false;
      if (category && l.category !== category) return false;
      if (websiteStatus && l.websiteStatus !== websiteStatus) return false;
      if (service && !l.servicesToPitch.includes(service)) return false;
      if (priority && l.priority !== priority) return false;
      if (status && l.status !== status) return false;
      if (assignedFilter === "unassigned" && l.status !== "Unassigned") return false;
      if (assignedFilter === "assigned" && !l.assignedTo) return false;
      if (qLower) {
        const hay = `${l.businessName} ${l.phone} ${l.ownerName || ""} ${l.area} ${l.city}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = filtered.length;
  const leads = filtered.slice((page - 1) * limit, page * limit);
  return NextResponse.json({
    leads,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const businessName = String(body.businessName || "").trim();
    const category = String(body.category || "").trim();
    const city = String(body.city || "").trim();
    const rawPhone = String(body.phone || "").trim();

    if (!businessName || !category || !city || !rawPhone) {
      return NextResponse.json(
        { error: "Business name, category, city, and phone number are required." },
        { status: 400 }
      );
    }

    if (!isValidPhone(rawPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10–15 digit phone number." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(rawPhone);
    const existing = await getLeadByPhone(phone);
    if (existing) {
      return NextResponse.json(
        {
          error: `Duplicate phone number: already belongs to "${existing.businessName}" (${existing.city}).`,
        },
        { status: 409 }
      );
    }

    const whatsappSameAsPhone = Boolean(body.whatsappSameAsPhone);
    const whatsappNumber = whatsappSameAsPhone
      ? phone
      : body.whatsappNumber
      ? normalizePhone(String(body.whatsappNumber))
      : "";

    const now = new Date().toISOString();
    const newLead: Lead = {
      id: makeId("lead"),
      businessName,
      category,
      city,
      fullAddress: String(body.fullAddress || "").trim(),
      area: String(body.area || "").trim(),
      phone,
      whatsappNumber,
      whatsappSameAsPhone,
      ownerName: String(body.ownerName || "").trim(),
      googleRating:
        body.googleRating !== undefined && body.googleRating !== "" && body.googleRating !== null
          ? Number(body.googleRating)
          : null,
      googleReviews:
        body.googleReviews !== undefined && body.googleReviews !== "" && body.googleReviews !== null
          ? Number(body.googleReviews)
          : null,
      googleMapsLink: String(body.googleMapsLink || "").trim(),
      websiteStatus: body.websiteStatus || "No Website",
      websiteUrl: String(body.websiteUrl || "").trim(),
      instagramHandle: String(body.instagramHandle || "").trim(),
      instagramFollowers:
        body.instagramFollowers !== undefined &&
        body.instagramFollowers !== "" &&
        body.instagramFollowers !== null
          ? Number(body.instagramFollowers)
          : null,
      facebookLink: String(body.facebookLink || "").trim(),
      servicesToPitch: Array.isArray(body.servicesToPitch)
        ? body.servicesToPitch.map(String)
        : [],
      suggestedWebsiteType: body.suggestedWebsiteType || "Not Sure",
      bestTimeToCall: String(body.bestTimeToCall || "").trim(),
      preferredLanguage: body.preferredLanguage || "Hinglish",
      leadSource: body.leadSource || "Manual",
      priority: body.priority || "Warm",
      status: "Unassigned",
      assignedTo: null,
      assignedToName: null,
      batchId: null,
      assignedAt: null,
      visibleFrom: null,
      followUpDate: null,
      lastCalledAt: null,
      callCount: 0,
      createdBy: auth.user.id,
      createdAt: now,
      updatedAt: now,
    };

    await insertLeads([newLead]);

    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: `Added lead "${newLead.businessName}" (${newLead.city})`,
      entityType: "lead",
      entityId: newLead.id,
    });

    return NextResponse.json({ lead: newLead }, { status: 201 });
  } catch (err) {
    console.error("Create lead error:", err);
    return NextResponse.json(
      { error: "Failed to create lead." },
      { status: 500 }
    );
  }
}
