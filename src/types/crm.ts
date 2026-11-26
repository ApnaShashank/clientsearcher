export type WebsiteStatus =
  | "No Website"
  | "Old Website"
  | "Active Website"
  | "Website Down";

export type SuggestedWebsiteType =
  | "Basic Website"
  | "Business Website"
  | "E-commerce"
  | "Booking System"
  | "Not Sure";

export type PreferredLanguage = "Hindi" | "English" | "Hinglish";

export type LeadSource = "Notion Import" | "Excel Import" | "Manual" | "Other";

export type LeadPriority = "Hot" | "Warm" | "Cold";

export type CallOutcome =
  | "Interested"
  | "Not Interested"
  | "Callback"
  | "No Answer"
  | "Busy"
  | "Wrong Number"
  | "Meeting Fixed"
  | "Won";

export type LeadStatus = "Unassigned" | "Assigned" | CallOutcome;

export type DurationFeel = "<1 min" | "1-3 min" | "3+ min";

export interface Lead {
  id: string;
  businessName: string;
  category: string;
  city: string;
  fullAddress: string;
  area: string;
  phone: string;
  whatsappNumber?: string;
  whatsappSameAsPhone?: boolean;
  ownerName?: string;
  googleRating?: number | null;
  googleReviews?: number | null;
  googleMapsLink?: string;
  websiteStatus: WebsiteStatus;
  websiteUrl?: string;
  instagramHandle?: string;
  instagramFollowers?: number | null;
  facebookLink?: string;
  servicesToPitch: string[];
  suggestedWebsiteType: SuggestedWebsiteType;
  bestTimeToCall?: string;
  preferredLanguage: PreferredLanguage;
  leadSource: LeadSource;
  priority: LeadPriority;
  status: LeadStatus;
  assignedTo?: string | null;
  assignedToName?: string | null;
  batchId?: string | null;
  assignedAt?: string | null;
  visibleFrom?: string | null;
  followUpDate?: string | null;
  lastCalledAt?: string | null;
  callCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: "admin" | "caller";
  phone: string;
  homeCity: string;
  workingAreas: string[];
  preferredCategories: string[];
  isActive: boolean;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  email?: string;
  whatsappNumber?: string;
  fullAddress?: string;
  villageArea?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  preferredCallCityArea?: string;
  workExperience?: string;
  currentOccupation?: string;
  languagesSpoken?: string[];
  idProofType?: "Aadhaar" | "PAN";
  idProofNumber?: string;
  agreementSigned?: boolean;
  agreementSignedAt?: string;
  signatureDataUrl?: string;
  signedFullName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  leadPhoneLast4: string;
  callerId: string;
  callerName: string;
  calledAt: string;
  outcome: CallOutcome;
  note?: string;
  followUpDate?: string | null;
  durationFeel?: DurationFeel;
}

export type BatchStatus = "Scheduled" | "Live" | "Completed" | "Recalled";

export interface AppNotification {
  id: string;
  recipientId: string; // "admin" or caller userId
  title: string;
  message: string;
  type: "batch" | "followup" | "outcome" | "alert";
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Batch {
  id: string;
  name: string;
  callerId: string;
  callerName: string;
  leadIds: string[];
  visibleFrom: string;
  createdBy: string;
  createdAt: string;
  status: BatchStatus;
}

export interface AdminTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  status: "To Do" | "Done";
  createdAt: string;
  completedAt?: string | null;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: "admin" | "caller" | "system";
  action: string;
  entityType: "lead" | "caller" | "batch" | "auth" | "export" | "settings" | "task";
  entityId?: string;
  details?: string;
  timestamp: string;
}

export interface AppSettings {
  id: string;
  cities: string[];
  categories: string[];
  servicesToPitch: string[];
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  otherSocials?: string;
  trainingVideoUrl?: string;
  negotiationRules?: string[];
  updatedAt: string;
}

export interface ShowcaseItem {
  id: string;
  title: string;
  businessName: string;
  category: string;
  liveUrl: string;
  previewImage: string;
  logoImage?: string;
  type: "client" | "demo";
  createdAt: string;
}

export interface PricingRow {
  id: string;
  category: string;
  packageName: string;
  priceMin: number;
  priceMax: number;
  domainIncluded: boolean;
  domainNote: string;
  note: string;
  order: number;
}

export const DEFAULT_TRAINING_VIDEO_URL =
  "https://drive.google.com/file/d/1OXiMmYEhmX-KBhi57nugLxL005onhyhs/view";

export const DEFAULT_NEGOTIATION_RULES: string[] = [
  "Hamesha pehle upar wala rate bolo (jaise ₹6,000). Kam karna pade to dheere-dheere, ek hi baar me seedha neeche mat aao.",
  "Zyada kab lo: bada clinic/hospital ya bada restaurant, zyada pages/features, Admin Panel, online booking system, ya client ko kaam jaldi chahiye.",
  "Kam kab karo: chhoti si dukaan ho, sirf menu page chahiye ho, ya budget sach me tight ho — tab chhota package do.",
  'Floor se neeche kabhi mat jao: Website ₹4,500 se neeche nahi, Menu Page ₹1,000 se neeche nahi. Isse neeche client maange to bolo: "Sir, is rate par quality kaam possible nahi hai, mai apne sir se baat karke batata hu."',
  "Domain wali baat saaf bolo: Menu Page me domain NAHI milta; baaki sab websites me customised domain shamil hai.",
  "Payment hamesha Creightweb ko — khud kabhi paise mat lo (ye agreement me bhi hai).",
  'Pakka na ho to galat waada mat karo — "Sir se confirm karke batata hu" bolna sahi jawab hai.',
];

export const DEFAULT_PRICING_ROWS: PricingRow[] = [
  {
    id: "price_1",
    category: "Clinic / Hospital",
    packageName: "Website",
    priceMin: 4500,
    priceMax: 6000,
    domainIncluded: true,
    domainNote: "Yes — customised domain included",
    note: "Doctor se baat karke aur clinic ka size dekh kar rate rakho — bada clinic = upar wala rate",
    order: 1,
  },
  {
    id: "price_2",
    category: "Clinic / Hospital",
    packageName: "Website + Admin Panel",
    priceMin: 8000,
    priceMax: 10000,
    domainIncluded: true,
    domainNote: "Yes — customised domain included",
    note: "Admin panel chahiye to ye package — appointments/records khud manage kar sakte hain",
    order: 2,
  },
  {
    id: "price_3",
    category: "Restaurant",
    packageName: "Website",
    priceMin: 4500,
    priceMax: 6000,
    domainIncluded: true,
    domainNote: "Yes — customised domain included",
    note: "Menu, photos, location, order/enquiry — sab ke saath",
    order: 3,
  },
  {
    id: "price_4",
    category: "Restaurant",
    packageName: "Sirf Menu Page",
    priceMin: 1000,
    priceMax: 1500,
    domainIncluded: false,
    domainNote: "No — domain NAHI milega",
    note: "Sirf digital menu page chahiye to yehi package; domain nahi hai isme, client ko pehle saaf bata do",
    order: 4,
  },
  {
    id: "price_5",
    category: "Other (Salon, Gym, Coaching, Shops)",
    packageName: "Website",
    priceMin: 4500,
    priceMax: 6000,
    domainIncluded: true,
    domainNote: "Yes — customised domain included",
    note: "Business ka size aur features dekh kar rate",
    order: 5,
  },
];

export const DEFAULT_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Clinic",
  "Hospital",
  "Salon",
  "Gym",
  "Hotel",
  "Sweet Shop",
  "Clothing Store",
  "Coaching Institute",
  "Real Estate",
  "Other",
];

export const DEFAULT_CITIES = [
  "Azamgarh",
  "Lucknow",
  "Delhi",
  "Mumbai",
  "Varanasi",
  "Noida",
  "Bengaluru",
];

export const DEFAULT_SERVICES_TO_PITCH = [
  "New Website",
  "Website Redesign",
  "E-commerce Website",
  "Booking Website",
  "Social Media Handling",
  "AI Videos / Reels",
  "Google Profile Setup",
  "Ads",
];

export const WEBSITE_STATUSES: WebsiteStatus[] = [
  "No Website",
  "Old Website",
  "Active Website",
  "Website Down",
];

export const SUGGESTED_WEBSITE_TYPES: SuggestedWebsiteType[] = [
  "Basic Website",
  "Business Website",
  "E-commerce",
  "Booking System",
  "Not Sure",
];

export const PREFERRED_LANGUAGES: PreferredLanguage[] = [
  "Hindi",
  "English",
  "Hinglish",
];

export const LEAD_SOURCES: LeadSource[] = [
  "Notion Import",
  "Excel Import",
  "Manual",
  "Other",
];

export const LEAD_PRIORITIES: LeadPriority[] = ["Hot", "Warm", "Cold"];

export const CALL_OUTCOMES: CallOutcome[] = [
  "Interested",
  "Not Interested",
  "Callback",
  "No Answer",
  "Busy",
  "Wrong Number",
  "Meeting Fixed",
  "Won",
];

export const DURATION_FEELS: DurationFeel[] = ["<1 min", "1-3 min", "3+ min"];
