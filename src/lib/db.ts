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
  DEFAULT_CITIES,
  DEFAULT_CATEGORIES,
  DEFAULT_SERVICES_TO_PITCH,
} from "@/types/crm";

const uri = process.env.MONGODB_URI;

export interface InMemoryStore {
  leads: Lead[];
  users: User[];
  callLogs: CallLog[];
  batches: Batch[];
  adminTasks: AdminTask[];
  activities: ActivityLog[];
  settings: AppSettings;
  seeded: boolean;
}

declare global {
  var __creightwebMongoClient: MongoClient | null | undefined;
  var __creightwebDb: Db | null | undefined;
  var __creightwebStore: InMemoryStore | undefined;
  var __creightwebIndexesReady: boolean | undefined;
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
      settings: {
        id: "default",
        cities: [...DEFAULT_CITIES],
        categories: [...DEFAULT_CATEGORIES],
        servicesToPitch: [...DEFAULT_SERVICES_TO_PITCH],
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
    await db.collection("leads").createIndex({ phone: 1 }, { unique: true });
    await db.collection("leads").createIndex({ assignedTo: 1, status: 1 });
    await db.collection("leads").createIndex({ city: 1, area: 1, category: 1 });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("callLogs").createIndex({ callerId: 1, calledAt: -1 });
    await db.collection("callLogs").createIndex({ leadId: 1, calledAt: -1 });
    await db.collection("batches").createIndex({ callerId: 1, visibleFrom: -1 });
    await db.collection("activities").createIndex({ timestamp: -1 });
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
      updatedAt: new Date().toISOString(),
    });
  }

  const usersCol = db.collection<User>("users");
  const existingAdmin = await usersCol.findOne({ role: "admin" });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
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
  }
}

export function stripMongoId<T extends Document>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc as T & { _id?: unknown };
  return rest;
}

export async function getCollection<T extends Document>(
  name: "leads" | "users" | "callLogs" | "batches" | "adminTasks" | "activities" | "settings"
): Promise<{ col: Collection<T> | null; memory: InMemoryStore }> {
  await ensureSeeded();
  const db = await connectToDb();
  const memory = getMemoryStore();
  return {
    col: db ? db.collection<T>(name) : null,
    memory,
  };
}
