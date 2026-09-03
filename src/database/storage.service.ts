import { db, type ExportPayload, DB_VERSION } from "@/database/db";
import { DEFAULT_SETTINGS } from "@/engines/settings.types";
import { z } from "zod";

// JSON import/export service. Validates imported payload before inserting.
export const exportPayloadSchema = z.object({
  version: z.number(),
  exportedAt: z.number(),
  users: z.array(z.any()).default([]),
  projects: z.array(z.any()).default([]),
  tasks: z.array(z.any()).default([]),
  timeEntries: z.array(z.any()).default([]),
  breakEntries: z.array(z.any()).default([]),
  timelineEvents: z.array(z.any()).default([]),
  comments: z.array(z.any()).default([]),
  scheduleEvents: z.array(z.any()).default([]),
  bucketItems: z.array(z.any()).default([]),
  shareLinks: z.array(z.any()).default([]),
  settings: z.array(z.any()).default([]),
});

class StorageService {
  async exportJSON(): Promise<string> {
    const [users, projects, tasks, timeEntries, breakEntries, timelineEvents, comments, scheduleEvents, bucketItems, shareLinks, settings] =
      await Promise.all([
        db.users.toArray(),
        db.projects.toArray(),
        db.tasks.toArray(),
        db.timeEntries.toArray(),
        db.breakEntries.toArray(),
        db.timelineEvents.toArray(),
        db.comments.toArray(),
        db.scheduleEvents.toArray(),
        db.bucketItems.toArray(),
        db.shareLinks.toArray(),
        db.settings.toArray(),
      ]);
    const payload: ExportPayload = {
      version: DB_VERSION,
      exportedAt: Date.now(),
      users,
      projects,
      tasks,
      timeEntries,
      breakEntries,
      timelineEvents,
      comments,
      scheduleEvents,
      bucketItems,
      shareLinks,
      settings,
    };
    return JSON.stringify(payload, null, 2);
  }

  async importJSON(json: string, mode: "replace" | "merge" = "merge"): Promise<{ counts: Record<string, number> }> {
    const parsed = JSON.parse(json);
    const data = exportPayloadSchema.parse(parsed);
    if (data.version !== DB_VERSION) {
      throw new Error(`Unsupported schema version: ${data.version}. Expected ${DB_VERSION}.`);
    }
    this.validateReferences(data as unknown as ExportPayload);

    const counts: Record<string, number> = {};
    if (mode === "replace") {
      await Promise.all([
        db.users.clear(),
        db.projects.clear(),
        db.tasks.clear(),
        db.timeEntries.clear(),
        db.breakEntries.clear(),
        db.timelineEvents.clear(),
        db.comments.clear(),
        db.scheduleEvents.clear(),
        db.bucketItems.clear(),
        db.shareLinks.clear(),
        db.settings.clear(),
      ]);
    }

    await db.transaction("rw", db.tables, async () => {
      const ops: Array<[string, any[]]> = [
        ["users", data.users],
        ["projects", data.projects],
        ["tasks", data.tasks],
        ["timeEntries", data.timeEntries],
        ["breakEntries", data.breakEntries],
        ["timelineEvents", data.timelineEvents],
        ["comments", data.comments],
        ["scheduleEvents", data.scheduleEvents],
        ["bucketItems", data.bucketItems],
        ["shareLinks", data.shareLinks],
        ["settings", data.settings],
      ];
      for (const [table, rows] of ops) {
        if (rows.length) {
          await (db as any).table(table).bulkPut(rows);
          counts[table] = rows.length;
        } else {
          counts[table] = 0;
        }
      }
    });
    return { counts };
  }

  private validateReferences(data: ExportPayload) {
    const userIds = new Set(data.users.map((u) => u.id));
    const taskIds = new Set(data.tasks.map((t) => t.id));
    const projectIds = new Set(data.projects.map((p) => p.id));
    for (const t of data.tasks) {
      if (t.projectId && !projectIds.has(t.projectId)) throw new Error(`Task ${t.id} references unknown project ${t.projectId}`);
      for (const uid of t.assignedUserIds ?? []) {
        if (!userIds.has(uid)) throw new Error(`Task ${t.id} references unknown user ${uid}`);
      }
    }
    for (const e of data.timeEntries) {
      if (!taskIds.has(e.taskId)) throw new Error(`TimeEntry ${e.id} references unknown task ${e.taskId}`);
    }
    for (const e of data.scheduleEvents) {
      if (!taskIds.has(e.taskId)) throw new Error(`ScheduleEvent ${e.id} references unknown task ${e.taskId}`);
    }
    for (const e of data.timelineEvents) {
      if (!taskIds.has(e.taskId)) throw new Error(`TimelineEvent ${e.id} references unknown task ${e.taskId}`);
    }
    for (const c of data.comments) {
      if (!taskIds.has(c.taskId)) throw new Error(`Comment ${c.id} references unknown task ${c.taskId}`);
    }
  }

  async getStorageEstimate(): Promise<{ usage: number; quota: number; percent: number } | null> {
    if (!navigator.storage?.estimate) return null;
    const est = await navigator.storage.estimate();
    const usage = est.usage ?? 0;
    const quota = est.quota ?? 0;
    return { usage, quota, percent: quota ? Math.round((usage / quota) * 100) : 0 };
  }

  async requestPersistence(): Promise<boolean> {
    if (navigator.storage?.persist) {
      return navigator.storage.persist();
    }
    return false;
  }
}

export const storageService = new StorageService();