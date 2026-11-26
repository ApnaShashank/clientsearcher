import { Lead } from "@/types/crm";

/**
 * Generates a concise, actionable one-line pitch hint for the caller
 * based on the lead's website status, social presence, and services to pitch.
 */
export function generatePitchHint(lead: Partial<Lead>): string {
  const parts: string[] = [];

  if (lead.websiteStatus === "No Website") {
    parts.push("No website hai");
  } else if (lead.websiteStatus === "Old Website") {
    parts.push("Purani website hai (redesign needed)");
  } else if (lead.websiteStatus === "Website Down") {
    parts.push("Website down hai (urgent fix)");
  } else if (lead.websiteStatus === "Active Website") {
    parts.push("Active website hai");
  }

  if (lead.instagramHandle) {
    const followers = lead.instagramFollowers
      ? ` (${lead.instagramFollowers.toLocaleString("en-IN")} followers)`
      : "";
    parts.push(`Instagram active hai${followers}`);
  } else if (lead.googleRating && lead.googleRating >= 4.0) {
    parts.push(`Google pe ${lead.googleRating}★ rating hai`);
  }

  const services =
    lead.servicesToPitch && lead.servicesToPitch.length > 0
      ? lead.servicesToPitch.slice(0, 2).join(" + ")
      : lead.suggestedWebsiteType && lead.suggestedWebsiteType !== "Not Sure"
      ? lead.suggestedWebsiteType
      : "Business Website";

  if (parts.length === 0) {
    return `${lead.category || "Business"} hai → ${services} pitch karo`;
  }

  return `${parts.join(" · ")} → ${services} pitch karo`;
}
