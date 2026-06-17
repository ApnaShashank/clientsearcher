export type OutreachStatus =
  | "Not Contacted"
  | "Contacted"
  | "Interested"
  | "Not Interested"
  | "Fake"
  | "Forwarded"
  | "Won"
  | "Lost"
  | "Meeting Scheduled"
  | "Proposal Sent"
  | "Follow Up";

export interface Lead {
  id: string;
  businessName: string;
  category: string;
  rating: number;
  reviewsCount: number;
  address: string;
  phoneNumber: string;
  website: string;
  email: string;
  googleMapsUrl: string;
  facebookUrl?: string;
  instagramUrl?: string;
  leadScore: number; // 0-100
  websiteStatus: "Active" | "Slow" | "No Website" | "Down";
  seoScore: number; // 0-100
  mobileFriendly: boolean;
  sslEnabled: boolean;
  googleReviewsChecked: boolean;
  lastUpdated: string;
}

export interface SavedLeadDetails {
  userId: string;
  leadId: string;
  notes: string;
  followUpDate?: string;
  status: OutreachStatus;
  campaignId?: string;
  savedAt: string;
}


export interface Campaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  leadId: string;
  leadName: string;
  action: string; // e.g. "Saved lead", "Changed status to Contacted", "Added note"
  timestamp: string;
}

export interface SearchLog {
  id: string;
  userId: string;
  userName: string;
  query: string;
  city: string;
  category: string;
  timestamp: string;
  resultsCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  plan: "Free" | "Pro" | "Enterprise";
  isBanned: boolean;
  joinedAt: string;
}

export interface SearchFilters {
  onlyVerified: boolean;
  onlyPopular: boolean;
  minRating: number;
  minReviews: number;
  hasWebsite: boolean;
  noWebsite: boolean;
  oldWebsite: boolean;
  noSsl: boolean;
  noGoogleReviews: boolean;
  noSocialMedia: boolean;
  hasContactNumber: boolean;
  hasEmail: boolean;
  recentlyOpened: boolean;
  highReviewCount: boolean;
  premiumLeadScore: boolean;
}
