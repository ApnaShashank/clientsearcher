import {
  Lead,
  User,
  CallLog,
  Batch,
  AdminTask,
  ActivityLog,
  AppSettings,
  ShowcaseItem,
  PricingRow,
  DEFAULT_CITIES,
  DEFAULT_CATEGORIES,
  DEFAULT_SERVICES_TO_PITCH,
  DEFAULT_TRAINING_VIDEO_URL,
  DEFAULT_NEGOTIATION_RULES,
  DEFAULT_PRICING_ROWS,
} from "@/types/crm";
import { getCollection, stripMongoId } from "./db";

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Settings ──────────────────────────────────────────────
export async function getAppSettings(): Promise<AppSettings> {
  const { col, memory } = await getCollection<AppSettings>("settings");
  const defaults = {
    contactPhone: "8808108802",
    contactWhatsapp: "8808108802",
    contactEmail: "contact@creightweb.com",
    instagramUrl: "",
    facebookUrl: "",
    linkedinUrl: "",
    otherSocials: "",
    trainingVideoUrl: DEFAULT_TRAINING_VIDEO_URL,
    negotiationRules: [...DEFAULT_NEGOTIATION_RULES],
  };
  if (col) {
    const doc = await col.findOne({ id: "default" });
    if (doc) {
      return {
        ...defaults,
        ...(stripMongoId(doc) as AppSettings),
      };
    }
    const fallback: AppSettings = {
      id: "default",
      cities: [...DEFAULT_CITIES],
      categories: [...DEFAULT_CATEGORIES],
      servicesToPitch: [...DEFAULT_SERVICES_TO_PITCH],
      ...defaults,
      updatedAt: new Date().toISOString(),
    };
    await col.insertOne({ ...fallback });
    return fallback;
  }
  return { ...defaults, ...memory.settings };
}

export async function updateAppSettings(
  patch: Partial<Omit<AppSettings, "id" | "updatedAt">>
): Promise<AppSettings> {
  const current = await getAppSettings();
  const next: AppSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const { col, memory } = await getCollection<AppSettings>("settings");
  if (col) {
    await col.replaceOne({ id: "default" }, { ...next }, { upsert: true });
  } else {
    memory.settings = next;
  }
  return next;
}

// ── Showcase ("Our Work") ─────────────────────────────────
export async function getAllShowcase(): Promise<ShowcaseItem[]> {
  const { col, memory } = await getCollection<ShowcaseItem>("showcase");
  if (col) {
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => stripMongoId(d) as ShowcaseItem);
  }
  return [...memory.showcase].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function insertShowcaseItem(item: ShowcaseItem): Promise<void> {
  const { col, memory } = await getCollection<ShowcaseItem>("showcase");
  if (col) {
    await col.insertOne({ ...item });
  } else {
    memory.showcase.unshift(item);
  }
}

export async function updateShowcaseItem(
  id: string,
  patch: Partial<ShowcaseItem>
): Promise<ShowcaseItem | null> {
  const { col, memory } = await getCollection<ShowcaseItem>("showcase");
  if (col) {
    await col.updateOne({ id }, { $set: patch });
    const doc = await col.findOne({ id });
    return doc ? (stripMongoId(doc) as ShowcaseItem) : null;
  }
  const idx = memory.showcase.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  memory.showcase[idx] = { ...memory.showcase[idx], ...patch };
  return memory.showcase[idx];
}

export async function deleteShowcaseItem(id: string): Promise<boolean> {
  const { col, memory } = await getCollection<ShowcaseItem>("showcase");
  if (col) {
    const res = await col.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const len = memory.showcase.length;
  memory.showcase = memory.showcase.filter((s) => s.id !== id);
  return memory.showcase.length < len;
}

// ── Pricing / Guide ───────────────────────────────────────
export async function getAllPricingRows(): Promise<PricingRow[]> {
  const { col, memory } = await getCollection<PricingRow>("pricing");
  if (col) {
    const docs = await col.find({}).sort({ order: 1 }).toArray();
    if (docs.length === 0) {
      await col.insertMany(DEFAULT_PRICING_ROWS.map((r) => ({ ...r })));
      return [...DEFAULT_PRICING_ROWS];
    }
    return docs.map((d) => stripMongoId(d) as PricingRow);
  }
  return [...memory.pricing].sort((a, b) => a.order - b.order);
}

export async function insertPricingRow(row: PricingRow): Promise<void> {
  const { col, memory } = await getCollection<PricingRow>("pricing");
  if (col) {
    await col.insertOne({ ...row });
  } else {
    memory.pricing.push(row);
  }
}

export async function updatePricingRow(
  id: string,
  patch: Partial<PricingRow>
): Promise<PricingRow | null> {
  const { col, memory } = await getCollection<PricingRow>("pricing");
  if (col) {
    await col.updateOne({ id }, { $set: patch });
    const doc = await col.findOne({ id });
    return doc ? (stripMongoId(doc) as PricingRow) : null;
  }
  const idx = memory.pricing.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  memory.pricing[idx] = { ...memory.pricing[idx], ...patch };
  return memory.pricing[idx];
}

export async function deletePricingRow(id: string): Promise<boolean> {
  const { col, memory } = await getCollection<PricingRow>("pricing");
  if (col) {
    const res = await col.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const len = memory.pricing.length;
  memory.pricing = memory.pricing.filter((r) => r.id !== id);
  return memory.pricing.length < len;
}

// ── Leads ─────────────────────────────────────────────────
export async function getAllLeads(): Promise<Lead[]> {
  const { col, memory } = await getCollection<Lead>("leads");
  if (col) {
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => stripMongoId(d) as Lead);
  }
  return [...memory.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const { col, memory } = await getCollection<Lead>("leads");
  if (col) {
    const doc = await col.findOne({ id });
    return doc ? (stripMongoId(doc) as Lead) : null;
  }
  return memory.leads.find((l) => l.id === id) || null;
}

export async function getLeadByPhone(phone: string): Promise<Lead | null> {
  const { col, memory } = await getCollection<Lead>("leads");
  if (col) {
    const doc = await col.findOne({ phone });
    return doc ? (stripMongoId(doc) as Lead) : null;
  }
  return memory.leads.find((l) => l.phone === phone) || null;
}

export async function insertLeads(leads: Lead[]): Promise<void> {
  if (leads.length === 0) return;
  const { col, memory } = await getCollection<Lead>("leads");
  if (col) {
    await col.insertMany(leads.map((l) => ({ ...l })));
  } else {
    memory.leads.unshift(...leads);
  }
}

export async function updateLead(
  id: string,
  patch: Partial<Lead>
): Promise<Lead | null> {
  const { col, memory } = await getCollection<Lead>("leads");
  const updatedAt = new Date().toISOString();
  if (col) {
    await col.updateOne({ id }, { $set: { ...patch, updatedAt } });
    const doc = await col.findOne({ id });
    return doc ? (stripMongoId(doc) as Lead) : null;
  }
  const idx = memory.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  memory.leads[idx] = { ...memory.leads[idx], ...patch, updatedAt };
  return memory.leads[idx];
}

export async function bulkAssignLeads(
  leadIds: string[],
  patch: Partial<Lead>
): Promise<void> {
  if (leadIds.length === 0) return;
  const { col, memory } = await getCollection<Lead>("leads");
  const updatedAt = new Date().toISOString();
  if (col) {
    await col.updateMany(
      { id: { $in: leadIds } },
      { $set: { ...patch, updatedAt } }
    );
  } else {
    const idSet = new Set(leadIds);
    memory.leads = memory.leads.map((l) =>
      idSet.has(l.id) ? { ...l, ...patch, updatedAt } : l
    );
  }
}

// ── Users / Callers ───────────────────────────────────────
export async function getAllUsers(): Promise<User[]> {
  const { col, memory } = await getCollection<User>("users");
  if (col) {
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => stripMongoId(d) as User);
  }
  return [...memory.users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const norm = username.trim().toLowerCase();
  const { col, memory } = await getCollection<User>("users");
  if (col) {
    const doc = await col.findOne({ username: norm });
    return doc ? (stripMongoId(doc) as User) : null;
  }
  return memory.users.find((u) => u.username.toLowerCase() === norm) || null;
}

export async function insertUser(user: User): Promise<void> {
  const { col, memory } = await getCollection<User>("users");
  if (col) {
    await col.insertOne({ ...user });
  } else {
    memory.users.unshift(user);
  }
}

export async function updateUser(
  id: string,
  patch: Partial<User>
): Promise<User | null> {
  const { col, memory } = await getCollection<User>("users");
  const updatedAt = new Date().toISOString();
  if (col) {
    await col.updateOne({ id }, { $set: { ...patch, updatedAt } });
    const doc = await col.findOne({ id });
    return doc ? (stripMongoId(doc) as User) : null;
  }
  const idx = memory.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  memory.users[idx] = { ...memory.users[idx], ...patch, updatedAt };
  return memory.users[idx];
}

// ── CallLogs ──────────────────────────────────────────────
export async function getAllCallLogs(filter?: {
  callerId?: string;
  leadId?: string;
}): Promise<CallLog[]> {
  const { col, memory } = await getCollection<CallLog>("callLogs");
  if (col) {
    const q: Record<string, string> = {};
    if (filter?.callerId) q.callerId = filter.callerId;
    if (filter?.leadId) q.leadId = filter.leadId;
    const docs = await col.find(q).sort({ calledAt: -1 }).toArray();
    return docs.map((d) => stripMongoId(d) as CallLog);
  }
  return memory.callLogs
    .filter((c) => {
      if (filter?.callerId && c.callerId !== filter.callerId) return false;
      if (filter?.leadId && c.leadId !== filter.leadId) return false;
      return true;
    })
    .sort((a, b) => b.calledAt.localeCompare(a.calledAt));
}

export async function insertCallLog(log: CallLog): Promise<void> {
  const { col, memory } = await getCollection<CallLog>("callLogs");
  if (col) {
    await col.insertOne({ ...log });
  } else {
    memory.callLogs.unshift(log);
  }
}

// ── Batches ───────────────────────────────────────────────
export async function getAllBatches(callerId?: string): Promise<Batch[]> {
  const { col, memory } = await getCollection<Batch>("batches");
  if (col) {
    const q = callerId ? { callerId } : {};
    const docs = await col.find(q).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => stripMongoId(d) as Batch);
  }
  return memory.batches
    .filter((b) => (!callerId ? true : b.callerId === callerId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function insertBatch(batch: Batch): Promise<void> {
  const { col, memory } = await getCollection<Batch>("batches");
  if (col) {
    await col.insertOne({ ...batch });
  } else {
    memory.batches.unshift(batch);
  }
}

// ── Admin Tasks ───────────────────────────────────────────
export async function getAllTasks(): Promise<AdminTask[]> {
  const { col, memory } = await getCollection<AdminTask>("adminTasks");
  if (col) {
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => stripMongoId(d) as AdminTask);
  }
  return [...memory.adminTasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function insertTask(task: AdminTask): Promise<void> {
  const { col, memory } = await getCollection<AdminTask>("adminTasks");
  if (col) {
    await col.insertOne({ ...task });
  } else {
    memory.adminTasks.unshift(task);
  }
}

export async function updateTask(
  id: string,
  patch: Partial<AdminTask>
): Promise<AdminTask | null> {
  const { col, memory } = await getCollection<AdminTask>("adminTasks");
  if (col) {
    await col.updateOne({ id }, { $set: patch });
    const doc = await col.findOne({ id });
    return doc ? (stripMongoId(doc) as AdminTask) : null;
  }
  const idx = memory.adminTasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  memory.adminTasks[idx] = { ...memory.adminTasks[idx], ...patch };
  return memory.adminTasks[idx];
}

export async function deleteTask(id: string): Promise<boolean> {
  const { col, memory } = await getCollection<AdminTask>("adminTasks");
  if (col) {
    const res = await col.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const len = memory.adminTasks.length;
  memory.adminTasks = memory.adminTasks.filter((t) => t.id !== id);
  return memory.adminTasks.length < len;
}

// ── Activities ────────────────────────────────────────────
export async function getRecentActivities(limit = 100): Promise<ActivityLog[]> {
  const { col, memory } = await getCollection<ActivityLog>("activities");
  if (col) {
    const docs = await col.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
    return docs.map((d) => stripMongoId(d) as ActivityLog);
  }
  return memory.activities.slice(0, limit);
}
