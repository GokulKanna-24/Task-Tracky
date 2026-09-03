import { db } from "@/database/db";
import { sharingRepository, makeShareLink } from "./sharing.repository";
import { timelineEngine } from "@/engines/timeline";
import { formatDateTime, formatDuration } from "@/shared/utils/time";
import type { ShareLink } from "./sharing.types";
import type { Task } from "@/engines/task/task.types";
import type { User } from "@/engines/user.types";
import type { ScheduleEvent } from "@/engines/scheduler/scheduler.types";
import type { TimelineEvent } from "@/engines/timeline/timeline.types";
import type { Comment } from "@/engines/comments/comment.types";

export interface PublicUser {
  displayName: string;
}

export interface PublicScheduleEvent {
  startAt: number;
  endAt: number;
  title: string;
}

export interface PublicTimelineEvent {
  timestamp: number;
  message: string;
  type: string;
}

export interface PublicComment {
  body: string;
  createdAt: number;
  authorName: string;
}

export interface PublicTimeSummary {
  totalSeconds: number;
  active: boolean;
}

export interface PublicTaskView {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: string[];
  assignees: PublicUser[];
  dueDate: number | null;
  schedule: PublicScheduleEvent[];
  timeSummary: PublicTimeSummary;
  timeline: PublicTimelineEvent[];
  comments: PublicComment[];
  progress: number;
}

class SharingEngine {
  async create(taskId: string, actorId: string, expiresInDays?: number): Promise<ShareLink> {
    const link = makeShareLink(taskId, expiresInDays);
    await db.transaction("rw", db.shareLinks, db.timelineEvents, async () => {
      await db.shareLinks.add(link);
      await timelineEngine.record(taskId, actorId, "updated", "Share link created");
    });
    return link;
  }

  async revoke(id: string, actorId: string): Promise<void> {
    const link = await sharingRepository.get(id);
    if (!link) return;
    await db.transaction("rw", db.shareLinks, db.timelineEvents, async () => {
      await sharingRepository.update(id, { isActive: false });
      await timelineEngine.record(link.taskId, actorId, "updated", "Share link revoked");
    });
  }

  async delete(id: string): Promise<void> {
    return sharingRepository.delete(id);
  }

  async getByTask(taskId: string): Promise<ShareLink[]> {
    return sharingRepository.byTask(taskId);
  }

  async getByToken(token: string): Promise<ShareLink | undefined> {
    const link = await sharingRepository.byToken(token);
    if (!link) return undefined;
    if (!link.isActive) return undefined;
    if (link.expiresAt && link.expiresAt < now()) return undefined;
    return link;
  }

  async getPublicTaskView(token: string): Promise<PublicTaskView | null> {
    const link = await this.getByToken(token);
    if (!link) return null;
    const task = await db.tasks.get(link.taskId);
    if (!task) return null;
    return this.sanitize(task);
  }

  async sanitize(task: Task): Promise<PublicTaskView> {
    const [users, schedule, timeline, comments, timeEntries] = await Promise.all([
      db.users.toArray(),
      db.scheduleEvents.where("taskId").equals(task.id).toArray(),
      db.timelineEvents.where("taskId").equals(task.id).reverse().sortBy("timestamp"),
      db.comments.where("taskId").equals(task.id).toArray(),
      db.timeEntries.where("taskId").equals(task.id).toArray(),
    ]);

    const assignees: PublicUser[] = task.assignedUserIds
      .map((uid) => users.find((u) => u.id === uid))
      .filter((u): u is User => Boolean(u))
      .map((u) => ({ displayName: u.fullName }));

    const totalSeconds = timeEntries.reduce((s, e) => {
      const end = e.endedAt ?? now();
      return s + Math.max(0, Math.floor((end - e.startedAt) / 1000));
    }, 0);
    const active = timeEntries.some((e) => e.status === "running");

    const publicComments: PublicComment[] = comments
      .filter((c) => c.visibility === "public")
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({ body: c.body, createdAt: c.createdAt, authorName: users.find((u) => u.id === c.userId)?.fullName ?? "Unknown" }));

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      labels: task.labels,
      assignees,
      dueDate: task.dueDate,
      schedule: schedule
        .filter((s: ScheduleEvent) => s.status === "scheduled")
        .map((s) => ({ startAt: s.startAt, endAt: s.endAt, title: s.title })),
      timeSummary: { totalSeconds, active },
      timeline: timeline.map((t: TimelineEvent) => ({ timestamp: t.timestamp, message: t.message, type: t.type })),
      comments: publicComments,
      progress: task.status === "completed" ? 100 : task.status === "review" ? 90 : task.status === "in_progress" ? 50 : task.status === "todo" ? 0 : 0,
    };
  }
}

import { now } from "@/shared/utils/time";
export const sharingEngine = new SharingEngine();