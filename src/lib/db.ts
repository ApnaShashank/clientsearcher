import { MongoClient, Db, Collection, Document } from "mongodb";
import bcrypt from "bcryptjs";
import {
  Lead,
  User,
  CallLog,
  Batch,
  AdminTask,
  ActivityLog,
  AppSettings,
  AppNotification,
  ShowcaseItem,
  PricingRow,
  DEFAULT_CITIES,
  DEFAULT_CATEGORIES,
  DEFAULT_SERVICES_TO_PITCH,
  DEFAULT_TRAINING_VIDEO_URL,
  DEFAULT_NEGOTIATION_RULES,
  DEFAULT_PRICING_ROWS,
} from "@/types/crm";

const uri = process.env.MONGODB_URI;

export interface InMemoryStore {
  leads: Lead[];
  users: User[];
  callLogs: CallLog[];
  batches: Batch[];
  adminTasks: AdminTask[];
  activities: ActivityLog[];
  notifications: AppNotification[];
  showcase: ShowcaseItem[];
  pricing: PricingRow[];
  settings: AppSettings;
  seeded: boolean;
}

declare global {
  var __creightwebMongoClient: MongoClient | null | undefined;
  var __creightwebDb: Db | null | undefined;
  var __creightwebStore: InMemoryStore | undefined;
  var __creightwebIndexesReady: boolean | undefined;
  var __creightwebAdminSynced: boolean | undefined;
}

function getMemoryStore(): InMemoryStore {
  if (!global.__creightwebStore) {
    global.__creightwebStore = {
      leads: [],
      users: [],
      callLogs: [],
      batches: [],
      adminTasks: [],
      activities: [],
      notifications: [],
      showcase: [],
      pricing: [...DEFAULT_PRICING_ROWS],
      settings: {
        id: "default",
        cities: [...DEFAULT_CITIES],
        categories: [...DEFAULT_CATEGORIES],
        servicesToPitch: [...DEFAULT_SERVICES_TO_PITCH],
        contactPhone: "8808108802",
        contactWhatsapp: "8808108802",
        contactEmail: "shashank8808108802@gmail.com",
        instagramUrl: "",
        facebookUrl: "",
        linkedinUrl: "",
        otherSocials: "",
        trainingVideoUrl: DEFAULT_TRAINING_VIDEO_URL,
        negotiationRules: [...DEFAULT_NEGOTIATION_RULES],
        updatedAt: new Date().toISOString(),
      },
      seeded: false,
    };
  }
  return global.__creightwebStore;
}

export async function connectToDb(): Promise<Db | null> {
  if (global.__creightwebDb) return global.__creightwebDb;
  if (!uri) {
    return null;
  }
  try {
    if (!global.__creightwebMongoClient) {
      global.__creightwebMongoClient = new MongoClient(uri);
      await global.__creightwebMongoClient.connect();
    }
    global.__creightwebDb = global.__creightwebMongoClient.db();
    return global.__creightwebDb;
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    return null;
  }
}

async function ensureIndexes(db: Db) {
  if (global.__creightwebIndexesReady) return;
  try {
    await Promise.all([
      db.collection("leads").createIndex({ phone: 1 }, { unique: true }),
      db.collection("leads").createIndex({ status: 1 }),
      db.collection("leads").createIndex({ assignedTo: 1, status: 1 }),
      db.collection("leads").createIndex({ batchId: 1 }),
      db.collection("leads").createIndex({ city: 1, category: 1 }),
      db.collection("leads").createIndex({ createdAt: -1 }),
      db.collection("users").createIndex({ username: 1 }, { unique: true }),
      db.collection("callLogs").createIndex({ callerId: 1, calledAt: -1 }),
      db.collection("callLogs").createIndex({ leadId: 1, calledAt: -1 }),
      db.collection("callLogs").createIndex({ calledAt: -1 }),
      db.collection("batches").createIndex({ callerId: 1, visibleFrom: -1 }),
      db.collection("batches").createIndex({ createdAt: -1 }),
      db.collection("activities").createIndex({ timestamp: -1 }),
      db.collection("notifications").createIndex({ recipientId: 1, createdAt: -1 }),
      db.collection("notifications").createIndex({ recipientId: 1, isRead: 1 }),
    ]);
    global.__creightwebIndexesReady = true;
  } catch (err) {
    console.error("Index creation warning:", err);
  }
}

export async function ensureSeeded(): Promise<void> {
  const db = await connectToDb();
  const adminUsername = (
    process.env.ADMIN_USERNAME ||
    process.env.ADMIN_EMAIL ||
    "admin"
  )
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "creightweb123";
  const adminName = process.env.ADMIN_NAME || "Creightweb Admin";

  if (!db) {
    const store = getMemoryStore();
    if (!store.seeded) {
      const existingAdmin = store.users.find((u) => u.role === "admin");
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        store.users.push({
          id: "admin_1",
          name: adminName,
          username: adminUsername,
          passwordHash,
          role: "admin",
          phone: "",
          homeCity: "Azamgarh",
          workingAreas: [],
          preferredCategories: [],
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }
      store.seeded = true;
    }
    return;
  }

  await ensureIndexes(db);

  const settingsCol = db.collection<AppSettings>("settings");
  const existingSettings = await settingsCol.findOne({ id: "default" });
  if (!existingSettings) {
    await settingsCol.insertOne({
      id: "default",
      cities: [...DEFAULT_CITIES],
      categories: [...DEFAULT_CATEGORIES],
      servicesToPitch: [...DEFAULT_SERVICES_TO_PITCH],
      contactPhone: "8808108802",
      contactWhatsapp: "8808108802",
      contactEmail: "shashank8808108802@gmail.com",
      instagramUrl: "",
      facebookUrl: "",
      linkedinUrl: "",
      otherSocials: "",
      trainingVideoUrl: DEFAULT_TRAINING_VIDEO_URL,
      negotiationRules: [...DEFAULT_NEGOTIATION_RULES],
      updatedAt: new Date().toISOString(),
    });
  }

  const pricingCol = db.collection<PricingRow>("pricing");
  const pricingCount = await pricingCol.countDocuments({});
  if (pricingCount === 0) {
    await pricingCol.insertMany(DEFAULT_PRICING_ROWS.map((r) => ({ ...r })));
  }

  const usersCol = db.collection<User>("users");
  if (!global.__creightwebAdminSynced) {
    const existingAdmin = await usersCol.findOne({ role: "admin" });
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    if (!existingAdmin) {
      await usersCol.insertOne({
        id: "admin_1",
        name: adminName,
        username: adminUsername,
        passwordHash,
        role: "admin",
        phone: "",
        homeCity: "Azamgarh",
        workingAreas: [],
        preferredCategories: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Sync env credentials & upgrade legacy admin docs that lacked username/passwordHash
      await usersCol.updateOne(
        { role: "admin" },
        {
          $set: {
            id: existingAdmin.id || "admin_1",
            name: adminName,
            username: adminUsername,
            passwordHash,
            role: "admin",
            isActive: true,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }
    global.__creightwebAdminSynced = true;
  }
}

export function stripMongoId<T extends Document>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc as T & { _id?: unknown };
  return rest;
}

export async function getCollection<T extends Document>(
  name:
    | "leads"
    | "users"
    | "callLogs"
    | "batches"
    | "adminTasks"
    | "activities"
    | "notifications"
    | "showcase"
    | "pricing"
    | "settings"
): Promise<{ col: Collection<T> | null; memory: InMemoryStore }> {
  await ensureSeeded();
  const db = await connectToDb();
  const memory = getMemoryStore();
  return {
    col: db ? db.collection<T>(name) : null,
    memory,
  };
}
