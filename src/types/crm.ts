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
  updatedAt: string;
}

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
