import { NextResponse } from "next/server";
import { getAllShowcase, getAppSettings } from "@/lib/repo";

export async function GET() {
  const [showcase, settings] = await Promise.all([
    getAllShowcase(),
    getAppSettings(),
  ]);

  return NextResponse.json({
    showcase,
    contact: {
      phone: settings.contactPhone || "8808108802",
      whatsapp: settings.contactWhatsapp || "8808108802",
      email: settings.contactEmail || "shashank8808108802@gmail.com",
      instagramUrl: settings.instagramUrl || "",
      facebookUrl: settings.facebookUrl || "",
      linkedinUrl: settings.linkedinUrl || "",
      otherSocials: settings.otherSocials || "",
    },
  });
}
