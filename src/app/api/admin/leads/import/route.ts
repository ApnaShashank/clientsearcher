import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";
import { getAllLeads, insertLeads, makeId } from "@/lib/repo";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { logActivity } from "@/lib/activity";
import {
  Lead,
  LeadPriority,
  LeadSource,
  PreferredLanguage,
  SuggestedWebsiteType,
  WebsiteStatus,
} from "@/types/crm";

const TEMPLATE_COLUMNS = [
  "businessName",
  "category",
  "city",
  "area",
  "fullAddress",
  "phone",
  "whatsappNumber",
  "ownerName",
  "googleRating",
  "googleReviews",
  "googleMapsLink",
  "websiteStatus",
  "websiteUrl",
  "instagramHandle",
  "instagramFollowers",
  "facebookLink",
  "servicesToPitch",
  "suggestedWebsiteType",
  "bestTimeToCall",
  "preferredLanguage",
  "priority",
];

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const sampleRow = {
    businessName: "Sharma Family Restaurant",
    category: "Restaurant",
    city: "Lucknow",
    area: "Gomti Nagar",
    fullAddress: "14/2 Vibhuti Khand, Gomti Nagar, Lucknow 226010",
    phone: "9876543210",
    whatsappNumber: "9876543210",
    ownerName: "Rajesh Sharma",
    googleRating: 4.3,
    googleReviews: 128,
    googleMapsLink: "https://maps.google.com/?q=Sharma+Family+Restaurant+Lucknow",
    websiteStatus: "No Website",
    websiteUrl: "",
    instagramHandle: "@sharma_eats",
    instagramFollowers: 2400,
    facebookLink: "",
    servicesToPitch: "New Website, Google Profile Setup",
    suggestedWebsiteType: "Business Website",
    bestTimeToCall: "11 AM - 2 PM",
    preferredLanguage: "Hinglish",
    priority: "Hot",
  };

  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: TEMPLATE_COLUMNS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LeadsTemplate");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="creightweb-leads-template.xlsx"',
    },
  });
}

function normalizeWebsiteStatus(val: unknown): WebsiteStatus {
  const s = String(val || "").trim().toLowerCase();
  if (s.includes("old")) return "Old Website";
  if (s.includes("active")) return "Active Website";
  if (s.includes("down")) return "Website Down";
  return "No Website";
}

function normalizeSuggestedType(val: unknown): SuggestedWebsiteType {
  const s = String(val || "").trim().toLowerCase();
  if (s.includes("basic")) return "Basic Website";
  if (s.includes("business")) return "Business Website";
  if (s.includes("e-comm") || s.includes("ecomm")) return "E-commerce";
  if (s.includes("book")) return "Booking System";
  return "Not Sure";
}

function normalizeLanguage(val: unknown): PreferredLanguage {
  const s = String(val || "").trim().toLowerCase();
  if (s === "hindi") return "Hindi";
  if (s === "english") return "English";
  return "Hinglish";
}

function normalizePriority(val: unknown): LeadPriority {
  const s = String(val || "").trim().toLowerCase();
  if (s === "hot") return "Hot";
  if (s === "cold") return "Cold";
  return "Warm";
}

function pickField(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find(
      (rk) => rk.trim().toLowerCase() === k.toLowerCase()
    );
    if (found && row[found] !== undefined && row[found] !== null) {
      return String(row[found]).trim();
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = String(formData.get("mode") || "preview");
    const leadSource = (String(formData.get("leadSource") || "Excel Import") as LeadSource);

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuf, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json(
        { error: "Uploaded file has no sheets." },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (rawRows.length === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    const existingLeads = await getAllLeads();
    const existingPhones = new Set(existingLeads.map((l) => l.phone));
    const seenInFile = new Set<string>();

    const validLeads: Lead[] = [];
    const skipped: {
      row: number;
      businessName: string;
      phone: string;
      reason: string;
    }[] = [];

    const now = new Date().toISOString();

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // 1-indexed + header row
      const businessName = pickField(row, [
        "businessName",
        "business_name",
        "business name",
        "name",
      ]);
      const category = pickField(row, ["category", "type"]);
      const city = pickField(row, ["city"]);
      const rawPhone = pickField(row, ["phone", "phoneNumber", "phone_number", "mobile"]);

      if (!businessName || !category || !city || !rawPhone) {
        skipped.push({
          row: rowNum,
          businessName: businessName || "(Missing)",
          phone: rawPhone || "(Missing)",
          reason: "Missing required field (businessName, category, city, or phone)",
        });
        return;
      }

      if (!isValidPhone(rawPhone)) {
        skipped.push({
          row: rowNum,
          businessName,
          phone: rawPhone,
          reason: "Invalid phone number format",
        });
        return;
      }

      const phone = normalizePhone(rawPhone);
      if (existingPhones.has(phone)) {
        skipped.push({
          row: rowNum,
          businessName,
          phone,
          reason: "Duplicate phone already exists in CRM database",
        });
        return;
      }

      if (seenInFile.has(phone)) {
        skipped.push({
          row: rowNum,
          businessName,
          phone,
          reason: "Duplicate phone within uploaded file",
        });
        return;
      }

      seenInFile.add(phone);

      const rawWhatsapp = pickField(row, ["whatsappNumber", "whatsapp", "whatsapp_number"]);
      const whatsappNumber = rawWhatsapp ? normalizePhone(rawWhatsapp) : "";
      const servicesRaw = pickField(row, ["servicesToPitch", "services", "services_to_pitch"]);
      const servicesToPitch = servicesRaw
        ? servicesRaw
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const ratingStr = pickField(row, ["googleRating", "rating", "google_rating"]);
      const reviewsStr = pickField(row, ["googleReviews", "reviews", "google_reviews"]);
      const followersStr = pickField(row, ["instagramFollowers", "followers", "instagram_followers"]);

      validLeads.push({
        id: makeId("lead") + `_${index}`,
        businessName,
        category,
        city,
        fullAddress: pickField(row, ["fullAddress", "address", "full_address"]),
        area: pickField(row, ["area", "locality"]),
        phone,
        whatsappNumber: whatsappNumber || phone,
        whatsappSameAsPhone: !whatsappNumber || whatsappNumber === phone,
        ownerName: pickField(row, ["ownerName", "owner", "contactPerson", "owner_name"]),
        googleRating: ratingStr && !Number.isNaN(Number(ratingStr)) ? Number(ratingStr) : null,
        googleReviews: reviewsStr && !Number.isNaN(Number(reviewsStr)) ? Number(reviewsStr) : null,
        googleMapsLink: pickField(row, ["googleMapsLink", "mapsLink", "google_maps_link"]),
        websiteStatus: normalizeWebsiteStatus(pickField(row, ["websiteStatus", "website_status"])),
        websiteUrl: pickField(row, ["websiteUrl", "website", "website_url"]),
        instagramHandle: pickField(row, ["instagramHandle", "instagram", "instagram_handle"]),
        instagramFollowers:
          followersStr && !Number.isNaN(Number(followersStr)) ? Number(followersStr) : null,
        facebookLink: pickField(row, ["facebookLink", "facebook", "facebook_link"]),
        servicesToPitch,
        suggestedWebsiteType: normalizeSuggestedType(
          pickField(row, ["suggestedWebsiteType", "suggested_website_type"])
        ),
        bestTimeToCall: pickField(row, ["bestTimeToCall", "best_time_to_call"]),
        preferredLanguage: normalizeLanguage(
          pickField(row, ["preferredLanguage", "language", "preferred_language"])
        ),
        leadSource,
        priority: normalizePriority(pickField(row, ["priority"])),
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
      });
    });

    if (mode === "commit" && validLeads.length > 0) {
      await insertLeads(validLeads);
      await logActivity({
        actorId: auth.user.id,
        actorName: auth.user.name,
        actorRole: "admin",
        action: `Imported ${validLeads.length} leads (${skipped.length} skipped) from ${file.name}`,
        entityType: "lead",
      });
    }

    return NextResponse.json({
      mode,
      fileName: file.name,
      totalRows: rawRows.length,
      validCount: validLeads.length,
      skippedCount: skipped.length,
      skipped,
      previewValid: validLeads.slice(0, 50),
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "Failed to parse uploaded file." },
      { status: 500 }
    );
  }
}
