import { Lead } from "@/types/lead";
import { locationDatabase, categories } from "./locationData";

const businessNames: Record<string, string[]> = {
  "Clinic": ["CareFirst Family Practice", "Metro Health Clinic", "Apex Urgent Care", "Wellness Center", "Pinnacle Medical", "Beacon Health"],
  "Hospital": ["City General Hospital", "Mercy Health Center", "Saint Jude Hospital", "Mount Sinai Medical Center", "Northwestern Hospital"],
  "Dental Clinic": ["Bright Smiles Dentistry", "Elite Dental Care", "Modern Dental Studio", "Downtown Dental Center", "Pearl Dental Clinic"],
  "Gym": ["Iron Temple Fitness", "Pulse Gym & Wellness", "Apex Athletics", "Elevate Health Club", "Vanguard Fitness"],
  "Restaurant": ["The Golden Spatula", "Truffle & Vine", "Crave Kitchen", "Sizzle Grill", "Urban Feast", "Bella Italia", "Karma Café"],
  "Hotel": ["The Grandview Suites", "Urban Ritz", "Summit Lodge & Spa", "Apex Hotel", "Marriott Plaza", "Anchor Inn"],
  "School": ["Greenwood Academy", "Horizon High School", "Saint Xavier School", "Oakridge International", "Beacon Elementary"],
  "Lawyer": ["Apex Law Chambers", "Vanguard & Associates LLP", "Justice Partners", "Sentinel Legal", "Core Law Group"],
  "CA": ["S. K. Mehta & Co. Chartered Accountants", "Reliant Tax & Audit Services", "Summit FinTax Consultants", "Sterling Auditing Services"],
  "Salon": ["Luxe Hair & Beauty Salon", "Glitz & Glamour Studio", "The Barber Lounge", "Velvet Salon", "Urban Shear & Style"],
  "Real Estate": ["BlueSky Properties", "Premier Realty", "Vanguard Real Estate Group", "Compass Estates", "Centennial Realtors"]
};

// Fallback arrays
const genericPrefixes = ["Summit", "Apex", "Vanguard", "Infinity", "Horizon", "Elite", "Premier", "Metro", "Global", "Nova"];
const genericSuffixes = ["Group", "Solutions", "Services", "Partners", "Hub", "Associates", "Center", "Zone", "Co"];

export function generateMockLeads(): Lead[] {
  const list: Lead[] = [];
  let idCounter = 1;

  for (const country of Object.keys(locationDatabase)) {
    const countryData = locationDatabase[country];
    for (const state of countryData.states) {
      const cities = countryData.cities[state] || [];
      for (const city of cities) {
        for (const category of categories) {
          if (category === "Custom") continue;

          // Generate 2 leads per category per city to make database rich
          const count = 2;
          for (let i = 0; i < count; i++) {
            const id = `lead_${idCounter++}`;
            const prefixes = businessNames[category] || genericPrefixes;
            const baseName = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = genericSuffixes[Math.floor(Math.random() * genericSuffixes.length)];
            const businessName = baseName.includes(category) ? baseName : `${baseName} ${category} ${i > 0 ? suffix : ""}`.trim();

            const rating = parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 to 5.0
            const reviewsCount = Math.floor(Math.random() * 800) + 5;
            
            const pinCode = String(Math.floor(Math.random() * 90000) + 10000);
            const address = `${Math.floor(Math.random() * 900) + 100} Main St, ${city}, ${state} ${pinCode}`;
            
            const cleanNameForSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const website = Math.random() > 0.15 ? `https://www.${cleanNameForSlug}.com` : "";
            const email = website ? `info@${cleanNameForSlug}.com` : `contact.${cleanNameForSlug}@gmail.com`;

            const phonePrefix = country === "India" ? "+91 98765 " : "+1 (555) 01";
            const phoneNumber = `${phonePrefix}${Math.floor(Math.random() * 90000) + 10000}`;

            const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(businessName + ", " + address)}`;
            const facebookUrl = Math.random() > 0.4 ? `https://facebook.com/${cleanNameForSlug}` : undefined;
            const instagramUrl = Math.random() > 0.5 ? `https://instagram.com/${cleanNameForSlug}` : undefined;

            const websiteStatus = website 
              ? (Math.random() > 0.9 ? "Slow" : "Active") 
              : "No Website";

            const sslEnabled = website ? Math.random() > 0.08 : false;
            const seoScore = website ? Math.floor(Math.random() * 45) + 50 : 0;
            const mobileFriendly = website ? Math.random() > 0.15 : false;

            // Lead score calculation
            let leadScore = Math.floor((rating * 10) + (reviewsCount > 50 ? 20 : 5));
            if (website) leadScore += 15;
            if (facebookUrl || instagramUrl) leadScore += 10;
            if (sslEnabled) leadScore += 5;
            leadScore = Math.min(Math.max(leadScore, 10), 100);

            list.push({
              id,
              businessName,
              category,
              rating,
              reviewsCount,
              address,
              phoneNumber,
              website,
              email,
              googleMapsUrl,
              facebookUrl,
              instagramUrl,
              leadScore,
              websiteStatus,
              seoScore,
              mobileFriendly,
              sslEnabled,
              googleReviewsChecked: Math.random() > 0.1,
              lastUpdated: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
        }
      }
    }
  }

  return list;
}
