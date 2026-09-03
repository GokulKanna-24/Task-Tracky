import { db } from "@/database/db";
import type { TimelineEvent, TimelineEventType } from "./timeline.types";
import { createTimelineEventId } from "@/shared/utils/ids";
import { now } from "@/shared/utils/time";

export const timelineRepository = {
  async add(event: Omit<TimelineEvent, "id" | "timestamp"> & { timestamp?: number }): Promise<TimelineEvent> {
    const full: TimelineEvent = {
      id: createTimelineEventId(),
      timestamp: event.timestamp ?? now(),
      ...event,
    };
    await db.timelineEvents.add(full);
    return full;
  },
  async getByTask(taskId: string): Promise<TimelineEvent[]> {
    return db.timelineEvents.where("taskId").equals(taskId).reverse().sortBy("timestamp");
  },
  async getByUser(userId: string): Promise<TimelineEvent[]> {
    return db.timelineEvents.where("userId").equals(userId).reverse().sortBy("timestamp");
  },
  async getRecent(limit = 20): Promise<TimelineEvent[]> {
    return db.timelineEvents.reverse().sortBy("timestamp").then((events) => events.slice(0, limit));
  },
  async deleteByTask(taskId: string): Promise<void> {
    await db.timelineEvents.where("taskId").equals(taskId).delete();
  },
};