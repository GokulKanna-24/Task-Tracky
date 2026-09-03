import { db } from "@/database/db";

export interface TaskTrackyBackupPayload {
  version: number;
  exportedAt: number;
  app: string;
  data: {
    users: any[];
    projects: any[];
    tasks: any[];
    bucketItems: any[];
    scheduleEvents: any[];
    timeEntries: any[];
    breakEntries: any[];
    timelineEvents: any[];
    comments: any[];
    shareLinks: any[];
    settings: any[];
  };
}

export class BackupService {
  async exportBackupPayload(): Promise<TaskTrackyBackupPayload> {
    const users = await db.users.toArray();
    const projects = await db.projects.toArray();
    const tasks = await db.tasks.toArray();
    const bucketItems = await db.bucketItems.toArray();
    const scheduleEvents = await db.scheduleEvents.toArray();
    const timeEntries = await db.timeEntries.toArray();
    const breakEntries = await db.breakEntries.toArray();
    const timelineEvents = await db.timelineEvents.toArray();
    const comments = await db.comments.toArray();
    const shareLinks = await db.shareLinks.toArray();
    const settings = await db.settings.toArray();

    return {
      version: 1,
      exportedAt: Date.now(),
      app: "Task-Tracky",
      data: {
        users,
        projects,
        tasks,
        bucketItems,
        scheduleEvents,
        timeEntries,
        breakEntries,
        timelineEvents,
        comments,
        shareLinks,
        settings,
      },
    };
  }

  async exportBackupJSON(): Promise<string> {
    const payload = await this.exportBackupPayload();
    return JSON.stringify(payload, null, 2);
  }

  async importBackupPayload(payload: any): Promise<void> {
    if (!payload || !payload.data || typeof payload.data !== "object") {
      throw new Error("Invalid backup format: missing data container");
    }

    const {
      users = [],
      projects = [],
      tasks = [],
      bucketItems = [],
      scheduleEvents = [],
      timeEntries = [],
      breakEntries = [],
      timelineEvents = [],
      comments = [],
      shareLinks = [],
      settings = [],
    } = payload.data;

    await db.transaction("rw", db.tables, async () => {
      // Clear existing records
      await db.users.clear();
      await db.projects.clear();
      await db.tasks.clear();
      await db.bucketItems.clear();
      await db.scheduleEvents.clear();
      await db.timeEntries.clear();
      await db.breakEntries.clear();
      await db.timelineEvents.clear();
      await db.comments.clear();
      await db.shareLinks.clear();
      await db.settings.clear();

      // Bulk populate from payload
      if (users.length) await db.users.bulkPut(users);
      if (projects.length) await db.projects.bulkPut(projects);
      if (tasks.length) await db.tasks.bulkPut(tasks);
      if (bucketItems.length) await db.bucketItems.bulkPut(bucketItems);
      if (scheduleEvents.length) await db.scheduleEvents.bulkPut(scheduleEvents);
      if (timeEntries.length) await db.timeEntries.bulkPut(timeEntries);
      if (breakEntries.length) await db.breakEntries.bulkPut(breakEntries);
      if (timelineEvents.length) await db.timelineEvents.bulkPut(timelineEvents);
      if (comments.length) await db.comments.bulkPut(comments);
      if (shareLinks.length) await db.shareLinks.bulkPut(shareLinks);
      if (settings.length) await db.settings.bulkPut(settings);
    });
  }

  async importBackupJSON(jsonString: string): Promise<void> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      throw new Error(`Failed to parse backup JSON: ${e.message}`);
    }
    await this.importBackupPayload(parsed);
  }
}

export const backupService = new BackupService();
