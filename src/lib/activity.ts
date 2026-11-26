import { ActivityLog } from "@/types/crm";
import { getCollection } from "./db";

export async function logActivity(params: {
  actorId: string;
  actorName: string;
  actorRole: "admin" | "caller" | "system";
  action: string;
  entityType: ActivityLog["entityType"];
  entityId?: string;
  details?: string;
}): Promise<void> {
  const entry: ActivityLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    timestamp: new Date().toISOString(),
  };

  const { col, memory } = await getCollection<ActivityLog>("activities");
  if (col) {
    await col.insertOne({ ...entry });
  } else {
    memory.activities.unshift(entry);
    if (memory.activities.length > 1000) {
      memory.activities = memory.activities.slice(0, 1000);
    }
  }
}
