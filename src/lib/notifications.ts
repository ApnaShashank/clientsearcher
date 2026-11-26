import { AppNotification, Batch, Lead } from "@/types/crm";
import { getCollection, stripMongoId } from "./db";
import { makeId } from "./repo";

export async function createNotification(params: {
  recipientId: string;
  title: string;
  message: string;
  type: AppNotification["type"];
  entityId?: string;
}): Promise<AppNotification> {
  const notif: AppNotification = {
    id: makeId("notif"),
    recipientId: params.recipientId,
    title: params.title,
    message: params.message,
    type: params.type,
    entityId: params.entityId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const { col, memory } = await getCollection<AppNotification>("notifications");
  if (col) {
    await col.insertOne({ ...notif });
  } else {
    memory.notifications.unshift(notif);
    if (memory.notifications.length > 500) {
      memory.notifications = memory.notifications.slice(0, 500);
    }
  }
  return notif;
}

export async function getNotificationsForRecipient(
  recipientId: string,
  limit = 40
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const { col, memory } = await getCollection<AppNotification>("notifications");
  if (col) {
    const [docs, unreadCount] = await Promise.all([
      col
        .find({ recipientId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      col.countDocuments({ recipientId, isRead: false }),
    ]);
    return {
      notifications: docs.map((d) => stripMongoId(d) as AppNotification),
      unreadCount,
    };
  }

  const all = memory.notifications
    .filter((n) => n.recipientId === recipientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    notifications: all.slice(0, limit),
    unreadCount: all.filter((n) => !n.isRead).length,
  };
}

export async function markNotificationRead(
  recipientId: string,
  id?: string,
  markAll?: boolean
): Promise<void> {
  const { col, memory } = await getCollection<AppNotification>("notifications");
  if (col) {
    if (markAll) {
      await col.updateMany(
        { recipientId, isRead: false },
        { $set: { isRead: true } }
      );
    } else if (id) {
      await col.updateOne({ id, recipientId }, { $set: { isRead: true } });
    }
    return;
  }

  memory.notifications = memory.notifications.map((n) => {
    if (n.recipientId !== recipientId) return n;
    if (markAll || (id && n.id === id)) {
      return { ...n, isRead: true };
    }
    return n;
  });
}

/**
 * Generates due-today follow-up & newly visible scheduled-batch notifications
 * for a caller (at most once per batch / once per day).
 */
export async function syncCallerEventNotifications(
  callerId: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);

  const [{ col: notifCol, memory }, { col: batchCol }, { col: leadCol }] =
    await Promise.all([
      getCollection<AppNotification>("notifications"),
      getCollection<Batch>("batches"),
      getCollection<Lead>("leads"),
    ]);

  const existingNotifs = notifCol
    ? (
        await notifCol
          .find({ recipientId: callerId })
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray()
      ).map((d) => stripMongoId(d) as AppNotification)
    : memory.notifications.filter((n) => n.recipientId === callerId);

  // 1. Check scheduled batches that have now become visible
  const callerBatches = batchCol
    ? (await batchCol.find({ callerId }).toArray()).map(
        (d) => stripMongoId(d) as Batch
      )
    : memory.batches.filter((b) => b.callerId === callerId);

  for (const b of callerBatches) {
    if (b.visibleFrom <= nowIso && b.visibleFrom > b.createdAt) {
      const already = existingNotifs.some(
        (n) => n.type === "batch" && n.entityId === `live_${b.id}`
      );
      if (!already && b.leadIds.length > 0) {
        await createNotification({
          recipientId: callerId,
          title: "Scheduled Batch Now Live",
          message: `Batch "${b.name}" (${b.leadIds.length} leads) is now visible in your Today queue.`,
          type: "batch",
          entityId: `live_${b.id}`,
        });
      }
    }
  }

  // 2. Check follow-ups due today
  const dueFollowUpsCount = leadCol
    ? await leadCol.countDocuments({
        assignedTo: callerId,
        status: "Callback",
        followUpDate: { $lte: todayStr },
      })
    : memory.leads.filter(
        (l) =>
          l.assignedTo === callerId &&
          l.status === "Callback" &&
          (!l.followUpDate || l.followUpDate.slice(0, 10) <= todayStr)
      ).length;

  if (dueFollowUpsCount > 0) {
    const alreadyToday = existingNotifs.some(
      (n) => n.type === "followup" && n.entityId === `due_${todayStr}`
    );
    if (!alreadyToday) {
      await createNotification({
        recipientId: callerId,
        title: "Follow-ups Due Today",
        message: `You have ${dueFollowUpsCount} callback lead(s) due today. Check the Follow-ups tab.`,
        type: "followup",
        entityId: `due_${todayStr}`,
      });
    }
  }
}

/**
 * Checks if any caller has leads untouched for >24 hours after assignment
 * and notifies Admin once per day per caller.
 */
export async function syncAdminUntouchedNotifications(): Promise<void> {
  const cutoffIso = new Date(Date.now() - 24 * 3600_000).toISOString();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [{ col: leadCol, memory }, { col: notifCol }] = await Promise.all([
    getCollection<Lead>("leads"),
    getCollection<AppNotification>("notifications"),
  ]);

  const staleAssigned = leadCol
    ? (
        await leadCol
          .find({
            status: "Assigned",
            assignedAt: { $lte: cutoffIso },
          })
          .toArray()
      ).map((d) => stripMongoId(d) as Lead)
    : memory.leads.filter(
        (l) =>
          l.status === "Assigned" &&
          l.assignedAt &&
          l.assignedAt <= cutoffIso
      );

  if (staleAssigned.length === 0) return;

  const byCaller = new Map<string, { name: string; count: number }>();
  for (const l of staleAssigned) {
    if (!l.assignedTo) continue;
    const prev = byCaller.get(l.assignedTo) || {
      name: l.assignedToName || "Caller",
      count: 0,
    };
    prev.count += 1;
    byCaller.set(l.assignedTo, prev);
  }

  const existingAdminNotifs = notifCol
    ? (
        await notifCol
          .find({ recipientId: "admin", type: "alert" })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray()
      ).map((d) => stripMongoId(d) as AppNotification)
    : memory.notifications.filter(
        (n) => n.recipientId === "admin" && n.type === "alert"
      );

  for (const [callerId, info] of byCaller.entries()) {
    const key = `stale_${callerId}_${todayStr}`;
    if (!existingAdminNotifs.some((n) => n.entityId === key)) {
      await createNotification({
        recipientId: "admin",
        title: "Untouched Leads Alert",
        message: `${info.name} has ${info.count} lead(s) assigned over 24h ago still uncalled.`,
        type: "alert",
        entityId: key,
      });
    }
  }
}
