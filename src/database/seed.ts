import { db } from "./db";
import { DEFAULT_SETTINGS } from "@/engines/settings.types";
import { setCurrentUserId } from "@/engines/session";
import { createId } from "@/shared/utils/ids";
import { hashPassword } from "@/shared/utils/crypto";

const DAY = 86400000;
const HOUR = 3600000;

export async function seedIfEmpty(): Promise<void> {
  const count = await db.tasks.count();
  if (count > 0) {
    await ensureUsersHaveCredentials();
    return;
  }

  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const youId = "user_you";
  const johnId = "user_john";
  const saraId = "user_sara";

  const defaultPass = await hashPassword("Password123!");

  const users = [
    {
      id: youId,
      email: "you@tasktracky.app",
      fullName: "You (Admin)",
      role: "admin" as const,
      status: "active" as const,
      passwordHash: defaultPass.hash,
      salt: defaultPass.salt,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      createdAt: now - 30 * DAY,
    },
    {
      id: johnId,
      email: "john@tasktracky.app",
      fullName: "John Doe (Manager)",
      role: "manager" as const,
      status: "active" as const,
      passwordHash: defaultPass.hash,
      salt: defaultPass.salt,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      createdAt: now - 30 * DAY,
    },
    {
      id: saraId,
      email: "sara@tasktracky.app",
      fullName: "Sara Lee (Developer)",
      role: "user" as const,
      status: "active" as const,
      passwordHash: defaultPass.hash,
      salt: defaultPass.salt,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara",
      createdAt: now - 30 * DAY,
    },
  ];

  const projWeb = { id: createId("proj"), name: "Website Redesign", description: "Refresh the marketing site", color: "#6366f1", ownerId: youId, createdAt: now - 20 * DAY, updatedAt: now };
  const projMobile = { id: createId("proj"), name: "Mobile Application", description: "Cross-platform mobile app", color: "#ec4899", ownerId: youId, createdAt: now - 20 * DAY, updatedAt: now };
  const projOps = { id: createId("proj"), name: "Internal Operations", description: "Internal tooling", color: "#10b981", ownerId: youId, createdAt: now - 20 * DAY, updatedAt: now };
  const projects = [projWeb, projMobile, projOps];

  const tasks: any[] = [];

  const bucketItems: any[] = [];

  // Schedule events for today and this week
  const schedEvents: any[] = [];

  // Time entries — realistic tracked time
  const timeEntries: any[] = [];

  // Breaks today
  const breakEntries: any[] = [];

  // Timeline events
  const timeline: any[] = [];

  // Comments
  const comments: any[] = [];

  // A share link for task_1
  const shareLinks: any[] = [];

  await db.transaction("rw", db.tables, async () => {
    await db.users.bulkPut(users);
    await db.projects.bulkPut(projects);
    await db.tasks.bulkPut(tasks);
    await db.bucketItems.bulkPut(bucketItems);
    await db.scheduleEvents.bulkPut(schedEvents);
    await db.timeEntries.bulkPut(timeEntries);
    await db.breakEntries.bulkPut(breakEntries);
    await db.timelineEvents.bulkPut(timeline);
    await db.comments.bulkPut(comments);
    await db.shareLinks.bulkPut(shareLinks);
    await db.settings.put(DEFAULT_SETTINGS);
  });

  await ensureUsersHaveCredentials();
}

export async function ensureUsersHaveCredentials(): Promise<void> {
  try {
    const users = await db.users.toArray();
    if (users.length === 0) return;
    const defaultPass = await hashPassword("Password123!");

    for (const u of users) {
      let needsSave = false;
      const updates: any = {};

      if (!u.status) {
        updates.status = "active";
        needsSave = true;
      }
      if (!u.passwordHash || !u.salt) {
        updates.passwordHash = defaultPass.hash;
        updates.salt = defaultPass.salt;
        needsSave = true;
      }
      if (!u.avatarUrl) {
        updates.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`;
        needsSave = true;
      }

      if (needsSave) {
        await db.users.update(u.id, updates);
      }
    }
  } catch (e) {
    console.error("Error migrating users", e);
  }
}

function mkTask(id: string, projectId: string, title: string, description: string, status: any, priority: any, assignedUserIds: string[], labels: string[], dueDate: number | null, createdAt: number) {
  return {
    id, projectId, title, description, status, priority, assignedUserIds, labels, dueDate,
    createdAt, updatedAt: createdAt, assignedAt: assignedUserIds.length ? createdAt : null, source: "manual" as const,
  };
}
function mkBucket(title: string, description: string, priority: any, labels: string[], createdBy: string, createdAt: number) {
  return { id: createId("bucket"), title, description, priority, labels, createdAt, updatedAt: createdAt, createdBy, source: "bucket" as const, status: "available" as const };
}
function mkSched(taskId: string, userId: string, title: string, startAt: number, endAt: number, isPinned: boolean) {
  return { id: createId("sched"), taskId, userId, title, startAt, endAt, status: "scheduled" as const, isPinned, createdAt: Date.now(), updatedAt: Date.now() };
}
function mkTime(taskId: string, userId: string, startedAt: number, endedAt: number) {
  return { id: createId("time"), taskId, userId, startedAt, endedAt, durationSeconds: Math.floor((endedAt - startedAt) / 1000), status: "completed" as const };
}