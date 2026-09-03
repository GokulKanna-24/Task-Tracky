import Dexie, { type Table } from "dexie";
import type { User } from "@/engines/user.types";
import type { Project } from "@/engines/project/project.types";
import type { Task } from "@/engines/task/task.types";
import type { TimeEntry } from "@/engines/time/time.types";
import type { BreakEntry } from "@/engines/time/time.types";
import type { TimelineEvent } from "@/engines/timeline/timeline.types";
import type { Comment } from "@/engines/comments/comment.types";
import type { ScheduleEvent } from "@/engines/scheduler/scheduler.types";
import type { BucketItem } from "@/engines/bucket/bucket.types";
import type { ShareLink } from "@/engines/sharing/sharing.types";
import type { AppSettings } from "@/engines/settings.types";

export const DB_VERSION = 1;

export interface ExportPayload {
  version: number;
  exportedAt: number;
  users: User[];
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  breakEntries: BreakEntry[];
  timelineEvents: TimelineEvent[];
  comments: Comment[];
  scheduleEvents: ScheduleEvent[];
  bucketItems: BucketItem[];
  shareLinks: ShareLink[];
  settings: AppSettings[];
}

export class TaskTrackyDB extends Dexie {
  users!: Table<User, string>;
  projects!: Table<Project, string>;
  tasks!: Table<Task, string>;
  timeEntries!: Table<TimeEntry, string>;
  breakEntries!: Table<BreakEntry, string>;
  timelineEvents!: Table<TimelineEvent, string>;
  comments!: Table<Comment, string>;
  scheduleEvents!: Table<ScheduleEvent, string>;
  bucketItems!: Table<BucketItem, string>;
  shareLinks!: Table<ShareLink, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("TaskTrackyDB");
    this.version(DB_VERSION).stores({
      users: "id, email",
      projects: "id, ownerId, createdAt",
      tasks: "id, projectId, status, priority, createdAt, updatedAt, dueDate, source, bucketItemId",
      timeEntries: "id, taskId, userId, status, startedAt",
      breakEntries: "id, userId, status, startedAt",
      timelineEvents: "id, taskId, userId, type, timestamp",
      comments: "id, taskId, userId, visibility, createdAt",
      scheduleEvents: "id, taskId, userId, startAt, endAt, status, isPinned",
      bucketItems: "id, createdBy, status, createdAt",
      shareLinks: "id, taskId, token, isActive, expiresAt",
      settings: "id",
    });
  }
}

export const db = new TaskTrackyDB();