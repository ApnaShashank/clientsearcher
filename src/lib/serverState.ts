import { AdminTask, SystemNotification, PortfolioWebsite } from "@/types/lead";

export interface ServerState {
  onlineUsers: Record<string, number>; // sessionId -> lastActiveTimestamp
  searchLogs: any[];
  activities: any[];
  users: any[];
  apiKeyUsage: Record<string, number>;
  customApiKeys: Record<string, string>;
  notifications: any[];
  adminTasks: AdminTask[];
  systemNotifications: SystemNotification[];
  portfolioWebsites: PortfolioWebsite[];
}



declare global {
  var __serverState: ServerState | undefined;
}

if (!global.__serverState) {
  global.__serverState = {
    onlineUsers: {},
    searchLogs: [
      {
        id: "log_1",
        userId: "user_3",
        userName: "Localead Admin",
        query: "Dental Clinic in New York City",
        city: "New York City",
        category: "Dental Clinic",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        resultsCount: 28,
        leads: []
      },
      {
        id: "log_2",
        userId: "user_1",
        userName: "Alex Carter",
        query: "Hotel in London",
        city: "London",
        category: "Hotel",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        resultsCount: 42,
        leads: []
      }
    ],
    activities: [
      {
        id: "act_1",
        leadId: "lead_1",
        leadName: "CareFirst Family Practice",
        action: "Saved lead to Workspace",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "act_2",
        leadId: "lead_1",
        leadName: "CareFirst Family Practice",
        action: "Changed Outreach Status to \"Interested\"",
        timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
      },
      {
        id: "act_3",
        leadId: "lead_5",
        leadName: "Bright Smiles Dentistry",
        action: "Sent Cold Outreach Email",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ],
    users: [
      {
        id: "user_1",
        name: "Alex Carter",
        email: "alex@localead",
        role: "user",
        plan: "Pro",
        isBanned: false,
        joinedAt: "2026-03-15",
      },
      {
        id: "user_2",
        name: "Samantha Miller",
        email: "samantha@localead",
        role: "user",
        plan: "Free",
        isBanned: false,
        joinedAt: "2026-05-01",
      },
      {
        id: "user_3",
        name: "Localead Admin",
        email: "admin@localead",
        role: "admin",
        plan: "Enterprise",
        isBanned: false,
        joinedAt: "2026-01-10",
      }
    ],
    apiKeyUsage: {
      "OpenAI GPT-4o": 2,
      "Tavily Search": 1
    },
    customApiKeys: {
      "OPENAI_API_KEY": "",
      "TAVILY_API_KEY": ""
    },
    notifications: [],
    adminTasks: [],
    systemNotifications: [],
    portfolioWebsites: [
      {
        id: "port_1",
        name: "Vaidya Dental Care Clinic",
        url: "https://vaidyadental.com",
        businessType: "Dental Clinic",
        address: "Malleshwaram, Bengaluru, Karnataka",
        type: "client"
      },
      {
        id: "port_2",
        name: "The Spice Route Café",
        url: "https://spiceroutecafe.in",
        businessType: "Premium Casual Restaurant",
        address: "Indiranagar, Bengaluru, Karnataka",
        type: "client"
      },
      {
        id: "port_3",
        name: "Aura Premium Salon & Spa",
        url: "https://aurasalonmumbai.com",
        businessType: "Beauty & Wellness Salon",
        address: "Bandra West, Mumbai, Maharashtra",
        type: "client"
      },
      {
        id: "port_4",
        name: "Localead SaaS Landing Template",
        url: "https://templates.localead.com/leadfinder-saas",
        businessType: "SaaS Software Landing Page",
        address: "Electronic City, Bengaluru, India",
        type: "demo"
      },
      {
        id: "port_5",
        name: "Apex Luxury Real Estate Portal",
        url: "https://templates.localead.com/apex-realestate",
        businessType: "Real Estate Directory Template",
        address: "Connaught Place, New Delhi, India",
        type: "demo"
      }
    ]
  };
}

export const serverState = global.__serverState;
