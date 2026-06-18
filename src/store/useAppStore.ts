import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  Lead, SavedLeadDetails, Campaign, Activity, SearchLog, User, SearchFilters, OutreachStatus, AdminTask, SystemNotification, PortfolioWebsite 
} from "@/types/lead";
import { generateMockLeads } from "@/lib/mockLeads";

interface AppState {
  // Auth state
  currentUser: User | null;
  users: User[];
  
  // Database / State lists
  leads: Lead[];
  savedLeads: SavedLeadDetails[];
  campaigns: Campaign[];
  activities: Activity[];
  searchLogs: SearchLog[];
  onlineUsers: number;
  adminTasks: AdminTask[];
  systemNotifications: SystemNotification[];
  portfolioWebsites: PortfolioWebsite[];

  
  // Search parameters
  searchParams: {
    country: string;
    state: string;
    city: string;
    district: string;
    pinCode: string;
    category: string;
    customCategory: string;
    limit: number;
  };
  filters: SearchFilters;
  searchResults: Lead[];
  isSearching: boolean;
  
  // Actions - Auth
  login: (email: string, password?: string) => Promise<any>;
  register: (name: string, email: string, password?: string) => Promise<any>;
  logout: () => void;
  
  // Actions - Search
  setSearchParams: (params: Partial<AppState["searchParams"]>) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  executeSearch: (liveLeads?: Lead[]) => void;
  
  // Actions - Leads & CRM
  saveLead: (leadId: string, status?: OutreachStatus, notes?: string, followUpDate?: string, campaignId?: string) => void;
  removeSavedLead: (leadId: string) => void;
  updateLeadStatus: (leadId: string, status: OutreachStatus) => void;
  updateLeadNotes: (leadId: string, notes: string, followUpDate?: string) => void;
  assignLeadToCampaign: (leadId: string, campaignId: string) => void;
  
  // Actions - Campaigns
  createCampaign: (name: string, description: string) => void;
  
  // Actions - Admin
  updateUserPlan: (userId: string, plan: User["plan"]) => void;
  toggleBanUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  
  // Tick online users
  tickOnlineUsers: () => void;
  addActivity: (leadId: string, leadName: string, action: string) => void;
  
  // Theme Toggle
  theme: "dark" | "light";
  toggleTheme: () => void;
 
  // Actions - Admin Tasks
  fetchTasks: () => Promise<void>;
  createTask: (businessName: string, phoneNumber: string, googleMapsUrl: string, address: string, pdfUrl?: string) => Promise<any>;
  acceptTask: (taskId: string) => Promise<any>;
  updateTaskStatus: (taskId: string, status: AdminTask["status"]) => Promise<any>;
  updateTaskNotes: (taskId: string, notes: string) => Promise<any>;

  // Actions - System Notifications
  fetchNotifications: () => Promise<void>;
  sendSystemNotification: (recipientId: string, title: string, message: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateCurrentUser: (name: string, password?: string) => Promise<void>;

  // Actions - Portfolio
  fetchPortfolio: () => Promise<void>;
  addPortfolioWebsite: (name: string, url: string, businessType: string, address: string, type: "demo" | "client") => Promise<any>;
  deletePortfolioWebsite: (id: string) => Promise<void>;
}


const initialFilters: SearchFilters = {
  onlyVerified: false,
  onlyPopular: false,
  minRating: 0,
  minReviews: 0,
  hasWebsite: false,
  noWebsite: false,
  oldWebsite: false,
  noSsl: false,
  noGoogleReviews: false,
  noSocialMedia: false,
  hasContactNumber: false,
  hasEmail: false,
  recentlyOpened: false,
  highReviewCount: false,
  premiumLeadScore: false,
};

const defaultUsers: User[] = [
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
];

const defaultCampaigns: Campaign[] = [
  {
    id: "camp_1",
    name: "Q3 Dental Clinic Outreach",
    description: "Cold email & WhatsApp campaign targeting dentists in NY and London.",
    createdAt: "2026-06-01",
  },
  {
    id: "camp_2",
    name: "Hotel Website SEO Services",
    description: "Reaching out to local hotels without mobile responsive sites.",
    createdAt: "2026-06-10",
  }
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null, // Start logged out by default
      users: defaultUsers,
      leads: [], // Will populate client-side to prevent SSR mismatch or generated inside hydration
      savedLeads: [
        {
          userId: "user_2",
          leadId: "lead_1",
          status: "Interested",
          notes: "Spoke with The Rameshwaram Cafe manager. Scheduled proposal discussion for next Tuesday.",
          followUpDate: "2026-06-24",
          campaignId: "camp_1",
          savedAt: "2026-06-15"
        },
        {
          userId: "user_2",
          leadId: "lead_5",
          status: "Contacted",
          notes: "Contacted The Taj Mahal Palace guest relations regarding mobile site analytics.",
          followUpDate: "2026-06-20",
          campaignId: "camp_2",
          savedAt: "2026-06-16"
        }
      ],


      campaigns: defaultCampaigns,
      activities: [
        {
          id: "act_1",
          leadId: "lead_1",
          leadName: "CareFirst Family Practice",
          action: "Saved lead",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
        },
        {
          id: "act_2",
          leadId: "lead_1",
          leadName: "CareFirst Family Practice",
          action: "Changed status to Interested",
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
        },
        {
          id: "log_2",
          userId: "user_3",
          userName: "Localead Admin",
          query: "Hotel in London",
          city: "London",
          category: "Hotel",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          resultsCount: 42,
        }
      ],
      onlineUsers: 1,
      adminTasks: [],
      systemNotifications: [],
      portfolioWebsites: [],
      theme: "dark",

      toggleTheme: () => {
        const nextTheme = get().theme === "dark" ? "light" : "dark";
        set({ theme: nextTheme });
        if (typeof window !== "undefined") {
          const elements = [document.documentElement, document.body];
          elements.forEach(el => {
            if (nextTheme === "light") {
              el.classList.add("light");
            } else {
              el.classList.remove("light");
            }
          });
        }
      },
      
      searchParams: {
        country: "India",
        state: "Karnataka",
        city: "Bengaluru",
        district: "",
        pinCode: "",
        category: "Restaurant",
        customCategory: "",
        limit: 25,
      },

      filters: initialFilters,
      searchResults: [],
      isSearching: false,

      // Actions - Auth
      login: async (email, password = "") => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to sign in");
          }
          const data = await res.json();
          set({ currentUser: data.user });
          return data.user;
        } catch (err: any) {
          alert(err.message || "Failed to login");
          throw err;
        }
      },
      register: async (name, email, password = "") => {
        try {
          // Re-route registration through the login creator API
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to sign up");
          }
          const data = await res.json();
          set({ currentUser: data.user });
          return data.user;
        } catch (err: any) {
          alert(err.message || "Failed to register");
          throw err;
        }
      },
      logout: () => set({ currentUser: null }),

      // Actions - Search
      setSearchParams: (params) => set(state => ({
        searchParams: { ...state.searchParams, ...params }
      })),
      setFilters: (newFilters) => set(state => ({
        filters: { ...state.filters, ...newFilters }
      })),
      resetFilters: () => set({ filters: initialFilters }),
      
      executeSearch: (liveLeads) => {
        set({ isSearching: true });
        
        // Populate leads list if empty
        let currentLeads = get().leads;
        if (currentLeads.length === 0) {
          currentLeads = generateMockLeads();
          set({ leads: currentLeads });
        }

        const params = get().searchParams;
        const flts = get().filters;

        const filterLead = (lead: Lead) => {
          // 1. Check City (local database searches only; live API already handles city matching)
          if (!liveLeads && params.city && !lead.address.toLowerCase().includes(params.city.toLowerCase())) {
            return false;
          }
          // 2. Check Pin Code
          if (params.pinCode && !lead.address.includes(params.pinCode)) {
            return false;
          }
          // 3. Check Category
          const searchCat = params.category === "Custom" ? params.customCategory : params.category;
          if (!liveLeads && searchCat && lead.category.toLowerCase() !== searchCat.toLowerCase()) {
            return false;
          }

          // 4. Apply Advanced Filters
          if (flts.onlyVerified && lead.rating < 4.0) return false;
          if (flts.onlyPopular && lead.reviewsCount < 100) return false;
          if (flts.minRating > 0 && lead.rating < flts.minRating) return false;
          if (flts.minReviews > 0 && lead.reviewsCount < flts.minReviews) return false;
          
          if (flts.hasWebsite && !lead.website) return false;
          if (flts.noWebsite && lead.website) return false;
          if (flts.oldWebsite && (!lead.website || lead.seoScore > 65)) return false;
          if (flts.noSsl && lead.sslEnabled) return false;
          if (flts.noGoogleReviews && lead.googleReviewsChecked) return false;
          if (flts.noSocialMedia && (lead.facebookUrl || lead.instagramUrl)) return false;
          if (flts.hasContactNumber && !lead.phoneNumber) return false;
          if (flts.hasEmail && !lead.email) return false;
          if (flts.recentlyOpened && lead.reviewsCount > 30) return false;
          if (flts.highReviewCount && lead.reviewsCount < 250) return false;
          if (flts.premiumLeadScore && lead.leadScore < 80) return false;

          return true;
        };

        // If we have live API leads, inject them
        if (liveLeads && liveLeads.length > 0) {
          // Merge to the master leads list to prevent duplicate ids
          const mergedLeads = [...currentLeads];
          for (const l of liveLeads) {
            if (!mergedLeads.some(ml => ml.id === l.id)) {
              mergedLeads.push(l);
            }
          }

          const filteredLive = liveLeads.filter(filterLead);
          const slicedLive = filteredLive.slice(0, params.limit);

          set({ 
            leads: mergedLeads, 
            searchResults: slicedLive, 
            isSearching: false 
          });
          return;
        }

        // Run local filter query
        const filtered = currentLeads.filter(filterLead);
        const finalResults = filtered.slice(0, params.limit);
        
        // Log search
        const log = {
          id: `log_${Date.now()}`,
          userId: get().currentUser?.id || "anonymous",
          userName: get().currentUser?.name || "Anonymous",
          query: `${params.category || params.customCategory} in ${params.city}`,
          city: params.city,
          category: params.category || params.customCategory || "Custom",
          timestamp: new Date().toISOString(),
          resultsCount: finalResults.length
        };

        setTimeout(() => {
          set({ 
            searchResults: finalResults, 
            isSearching: false,
            searchLogs: [log, ...get().searchLogs]
          });

          // Sync database search logs and leads back to the server metrics log
          fetch("/api/admin/metrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "logSearch",
              payload: { searchLog: { ...log, leads: finalResults } }
            })
          }).catch(err => console.error("Failed to sync log to server:", err));
        }, 800); // realistic spinner feeling
      },

      // Actions - Leads & CRM
      saveLead: (leadId, status = "Not Contacted", notes = "", followUpDate, campaignId) => {
        const currentUserId = get().currentUser?.id || "guest";
        const isAlreadySaved = get().savedLeads.some(sl => sl.leadId === leadId && sl.userId === currentUserId);
        const leadObj = get().leads.find(l => l.id === leadId) || get().searchResults.find(l => l.id === leadId);
        const name = leadObj?.businessName || "Unknown Lead";

        if (isAlreadySaved) {
          return;
        }

        const newSaved: SavedLeadDetails = {
          userId: currentUserId,
          leadId,
          status,
          notes,
          followUpDate,
          campaignId,
          savedAt: new Date().toISOString().split("T")[0]
        };

        set(state => ({
          savedLeads: [newSaved, ...state.savedLeads]
        }));
        
        get().addActivity(leadId, name, "Saved Lead to Workspace");
      },
      
      removeSavedLead: (leadId) => {
        const currentUserId = get().currentUser?.id || "guest";
        const leadObj = get().leads.find(l => l.id === leadId);
        const name = leadObj?.businessName || "Unknown Lead";

        set(state => ({
          savedLeads: state.savedLeads.filter(sl => !(sl.leadId === leadId && sl.userId === currentUserId))
        }));

        get().addActivity(leadId, name, "Removed Lead from Workspace");
      },
      
      updateLeadStatus: (leadId, status) => {
        const currentUserId = get().currentUser?.id || "guest";
        const leadObj = get().leads.find(l => l.id === leadId) || get().searchResults.find(l => l.id === leadId);
        const name = leadObj?.businessName || "Unknown Lead";

        set(state => ({
          savedLeads: state.savedLeads.map(sl => 
            (sl.leadId === leadId && sl.userId === currentUserId) ? { ...sl, status } : sl
          )
        }));

        get().addActivity(leadId, name, `Changed Outreach Status to "${status}"`);

        // Check if normal user forwarded the lead
        if (status === "Forwarded" && get().currentUser?.role === "user") {
          fetch("/api/notify/forward", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId,
              leadDetails: leadObj,
              userEmail: get().currentUser?.email || "anonymous@localead",
              userName: get().currentUser?.name || "Anonymous User"
            })
          })
          .then(res => {
            if (res.ok) {
              alert("Lead successfully forwarded! An email alert has been sent to shashank8808108802@gmail.com.");
            }
          })
          .catch(err => console.error("Failed to forward lead alert:", err));
        }
      },
      
      updateLeadNotes: (leadId, notes, followUpDate) => {
        const currentUserId = get().currentUser?.id || "guest";
        const leadObj = get().leads.find(l => l.id === leadId);
        const name = leadObj?.businessName || "Unknown Lead";

        set(state => ({
          savedLeads: state.savedLeads.map(sl => 
            (sl.leadId === leadId && sl.userId === currentUserId) ? { ...sl, notes, followUpDate } : sl
          )
        }));

        get().addActivity(leadId, name, "Updated Lead notes & follow-up date");
      },

      assignLeadToCampaign: (leadId, campaignId) => {
        const currentUserId = get().currentUser?.id || "guest";
        const camp = get().campaigns.find(c => c.id === campaignId);
        const campName = camp?.name || "Campaign";
        const leadObj = get().leads.find(l => l.id === leadId);
        const name = leadObj?.businessName || "Unknown Lead";

        set(state => ({
          savedLeads: state.savedLeads.map(sl => 
            (sl.leadId === leadId && sl.userId === currentUserId) ? { ...sl, campaignId } : sl
          )
        }));

        get().addActivity(leadId, name, `Assigned to campaign "${campName}"`);
      },


      // Actions - Campaigns
      createCampaign: (name, description) => {
        const newCamp: Campaign = {
          id: `camp_${Date.now()}`,
          name,
          description,
          createdAt: new Date().toISOString().split("T")[0]
        };
        set(state => ({
          campaigns: [...state.campaigns, newCamp]
        }));
      },

      // Actions - Admin
      updateUserPlan: (userId, plan) => {
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, plan } : u),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, plan } : state.currentUser
        }));
        
        fetch("/api/admin/metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateUserPlan", payload: { userId, plan } })
        }).catch(err => console.error("Failed to update user plan on server:", err));
      },
      
      toggleBanUser: (userId) => {
        if (get().currentUser?.id === userId) {
          alert("You cannot ban yourself!");
          return;
        }
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, isBanned: !u.isBanned } : u)
        }));

        fetch("/api/admin/metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggleBanUser", payload: { userId } })
        }).catch(err => console.error("Failed to toggle ban on server:", err));
      },
      
      deleteUser: (userId) => {
        if (get().currentUser?.id === userId) {
          alert("You cannot delete yourself!");
          return;
        }
        set(state => ({
          users: state.users.filter(u => u.id !== userId)
        }));

        fetch("/api/admin/metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deleteUser", payload: { userId } })
        }).catch(err => console.error("Failed to delete user on server:", err));
      },

      // Online Counter Ping and Fetch
      tickOnlineUsers: async () => {
        try {
          const user = get().currentUser;
          const sessionId = user ? user.email : "anonymous_session";
          
          const response = await fetch("/api/online-users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          });
          if (response.ok) {
            const data = await response.json();
            set({ onlineUsers: data.count });
          }
        } catch (err) {
          console.error("Failed to ping online users:", err);
        }
      },

      fetchTasks: async () => {
        try {
          const res = await fetch("/api/tasks");
          if (res.ok) {
            const data = await res.json();
            set({ adminTasks: data.tasks || [] });
          }
        } catch (err) {
          console.error("Failed to fetch admin tasks:", err);
        }
      },

      createTask: async (businessName, phoneNumber, googleMapsUrl, address, pdfUrl = "") => {
        try {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              payload: { businessName, phoneNumber, googleMapsUrl, address, pdfUrl }
            })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to create task");
          }
          const data = await res.json();
          await get().fetchTasks();
          return data.task;
        } catch (err: any) {
          alert(err.message || "Failed to dispatch task");
          throw err;
        }
      },

      acceptTask: async (taskId) => {
        try {
          const user = get().currentUser;
          if (!user) {
            alert("Please login first to accept tasks!");
            return;
          }
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "accept",
              payload: {
                taskId,
                userId: user.id,
                userName: user.name
              }
            })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to accept task");
          }
          const data = await res.json();
          await get().fetchTasks();
          alert("Task successfully accepted! You are now assigned to this lead.");
          return data.task;
        } catch (err: any) {
          alert(err.message || "Failed to accept task");
          throw err;
        }
      },

      updateTaskStatus: async (taskId, status) => {
        try {
          const user = get().currentUser;
          if (!user) return;
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "updateStatus",
              payload: {
                taskId,
                userId: user.id,
                status
              }
            })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to update task status");
          }
          const data = await res.json();
          await get().fetchTasks();
          return data.task;
        } catch (err: any) {
          alert(err.message || "Failed to update task progress");
          throw err;
        }
      },

      updateTaskNotes: async (taskId, notes) => {
        try {
          const user = get().currentUser;
          if (!user) return;
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "updateNotes",
              payload: {
                taskId,
                userId: user.id,
                notes
              }
            })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to update task notes");
          }
          const data = await res.json();
          await get().fetchTasks();
          return data.task;
        } catch (err: any) {
          alert(err.message || "Failed to update task notes");
          throw err;
        }
      },

      fetchNotifications: async () => {
        try {
          const user = get().currentUser;
          if (!user) return;
          const res = await fetch(`/api/notifications?userId=${user.id}&role=${user.role}`);
          if (res.ok) {
            const data = await res.json();
            set({ systemNotifications: data.notifications || [] });
          }
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      },

      sendSystemNotification: async (recipientId, title, message) => {
        try {
          const user = get().currentUser;
          if (!user) return;
          const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "send",
              payload: {
                recipientId,
                title,
                message,
                senderName: user.name
              }
            })
          });
          if (res.ok) {
            await get().fetchNotifications();
          }
        } catch (err) {
          console.error("Failed to send notification:", err);
        }
      },

      markNotificationRead: async (notificationId) => {
        try {
          const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "markRead",
              payload: { notificationId }
            })
          });
          if (res.ok) {
            await get().fetchNotifications();
          }
        } catch (err) {
          console.error("Failed to mark notification read:", err);
        }
      },

      markAllNotificationsRead: async () => {
        try {
          const user = get().currentUser;
          if (!user) return;
          const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "markAllRead",
              payload: { recipientId: user.role === "admin" ? "admin" : user.id }
            })
          });
          if (res.ok) {
            await get().fetchNotifications();
          }
        } catch (err) {
          console.error("Failed to mark all notifications read:", err);
        }
      },

      updateCurrentUser: async (name, password) => {
        const user = get().currentUser;
        if (!user) return;

        const oldName = user.name;
        const passwordUpdated = !!password;
        
        set(state => ({
          currentUser: { 
            ...state.currentUser!, 
            name,
            ...(passwordUpdated ? { password } : {})
          },
          users: state.users.map(u => u.id === user.id ? { ...u, name, ...(passwordUpdated ? { password } : {}) } : u)
        }));

        try {
          let detailMessage = `User details updated. Old Name: "${oldName}", New Name: "${name}". Email: ${user.email}.`;
          if (passwordUpdated) {
            detailMessage += " Password was also changed.";
          }

          // 1. Send notification alert to admin
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "send",
              payload: {
                recipientId: "admin",
                title: "User Profile Changed",
                message: detailMessage,
                senderName: name
              }
            })
          });

          // 2. Sync profile update to server-wide state
          await fetch("/api/admin/metrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "updateUserProfile",
              payload: {
                userId: user.id,
                name,
                password: password || undefined
              }
            })
          });
        } catch (err) {
          console.error("Failed to notify admin of details change:", err);
        }
      },

      fetchPortfolio: async () => {
        try {
          const res = await fetch("/api/portfolio");
          if (res.ok) {
            const data = await res.json();
            set({ portfolioWebsites: data.portfolio || [] });
          }
        } catch (err) {
          console.error("Failed to fetch portfolio:", err);
        }
      },

      addPortfolioWebsite: async (name, url, businessType, address, type) => {
        try {
          const res = await fetch("/api/portfolio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "add",
              payload: { name, url, businessType, address, type }
            })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to add portfolio website");
          }
          const data = await res.json();
          await get().fetchPortfolio();
          return data.website;
        } catch (err: any) {
          alert(err.message || "Failed to add portfolio website");
          throw err;
        }
      },

      deletePortfolioWebsite: async (id) => {
        try {
          const res = await fetch("/api/portfolio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              payload: { id }
            })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to delete portfolio website");
          }
          await get().fetchPortfolio();
        } catch (err: any) {
          alert(err.message || "Failed to delete website");
          throw err;
        }
      },

      addActivity: (leadId, leadName, action) => {

        const newAct: Activity = {
          id: `act_${Date.now()}`,
          leadId,
          leadName,
          action,
          timestamp: new Date().toISOString()
        };
        set(state => ({
          activities: [newAct, ...state.activities].slice(0, 100) // Keep last 100
        }));

        // Sync with Next.js server state
        fetch("/api/admin/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, leadName, action })
        }).catch(err => console.error("Failed to sync activity to server:", err));
      }
    }),
    {
      name: "localead-storage", // Updated storage name to Localead
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        savedLeads: state.savedLeads,
        campaigns: state.campaigns,
        activities: state.activities,
        searchLogs: state.searchLogs,
        searchParams: state.searchParams,
        filters: state.filters,
        theme: state.theme
      })
    }
  )
);
