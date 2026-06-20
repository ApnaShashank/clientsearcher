import { MongoClient, Db } from "mongodb";
import { serverState } from "./serverState";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDb() {
  if (db) return db;
  if (!uri) {
    console.warn("MONGODB_URI not found in environment variables. Operating in pure in-memory mode.");
    return null;
  }
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    return db;
  } catch (err) {
    console.error("Failed to establish connection to MongoDB:", err);
    return null;
  }
}

const COLLECTIONS = [
  "adminTasks",
  "users",
  "activities",
  "systemNotifications",
  "portfolioWebsites",
  "forwardedLeads",
  "notifications",
  "searchLogs",
  "apiKeyUsage",
  "customApiKeys"
];

export async function syncState() {
  const database = await connectToDb();
  if (!database) return;

  try {
    const promises = COLLECTIONS.map(async (key) => {
      if (key === "apiKeyUsage" || key === "customApiKeys") {
        const doc = await database.collection("settings").findOne({ _id: key as any });
        if (doc) {
          const { _id, ...rest } = doc;
          (serverState as any)[key] = rest;
        } else {
          (serverState as any)[key] = {};
        }
      } else {
        const items = await database.collection(key).find().toArray();
        // Strip _id to conform with TS types
        const cleaned = items.map(({ _id, ...rest }) => rest);
        if (cleaned.length > 0) {
          (serverState as any)[key] = cleaned;
        } else {
          if (key === "users" || key === "portfolioWebsites") {
            // Database is empty, auto-seed with local initial state
            await saveState(key);
          } else {
            (serverState as any)[key] = [];
          }
        }
      }
    });

    await Promise.all(promises);
  } catch (err) {
    console.error("Failed to sync serverState from MongoDB:", err);
  }
}

export async function saveState(key: string) {
  const database = await connectToDb();
  if (!database) return;

  try {
    const data = (serverState as any)[key];
    if (!data) return;

    if (key === "apiKeyUsage" || key === "customApiKeys") {
      await database.collection("settings").replaceOne({ _id: key as any }, { ...data }, { upsert: true });
    } else if (Array.isArray(data)) {
      if (data.length > 0) {
        const bulkOps = data.map((item: any) => {
          const idVal = item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          if (!item.id) item.id = idVal;
          return {
            replaceOne: {
              filter: { id: idVal },
              replacement: item,
              upsert: true
            }
          };
        });
        
        await database.collection(key).bulkWrite(bulkOps);
        
        // Delete items from db that have been removed from the serverState array
        const activeIds = data.map((item: any) => item.id).filter(Boolean);
        await database.collection(key).deleteMany({ id: { $nin: activeIds } });
      } else {
        await database.collection(key).deleteMany({});
      }
    }
  } catch (err) {
    console.error(`Failed to save serverState key "${key}" to MongoDB:`, err);
  }
}
