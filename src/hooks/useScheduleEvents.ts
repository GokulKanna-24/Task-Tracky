import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/database/db";
import type { ScheduleEvent } from "@/engines/scheduler/scheduler.types";

export function useScheduleEvents() {
  return useLiveQuery(() => db.scheduleEvents.toArray(), [], []);
}

export function useScheduleInRange(start: number, end: number) {
  return useLiveQuery(async () => {
    const all = await db.scheduleEvents.where("startAt").between(start, end, true, true).toArray();
    return all.filter((e) => e.status !== "cancelled");
  }, [start, end], []);
}

export function useScheduleByUser(userId: string | null | undefined) {
  return useLiveQuery(async () => {
    if (!userId) return [];
    return db.scheduleEvents.where("userId").equals(userId).sortBy("startAt");
  }, [userId], []);
}

export function useScheduleByTask(taskId: string | undefined) {
  return useLiveQuery(async () => (taskId ? await db.scheduleEvents.where("taskId").equals(taskId).sortBy("startAt") : []), [taskId], []);
}

export function useScheduleForDay(userId: string | null | undefined, day: number) {
  return useLiveQuery(async () => {
    if (!userId) return [];
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);
    const events = await db.scheduleEvents.where("userId").equals(userId).toArray();
    return events
      .filter((e: ScheduleEvent) => e.status === "scheduled" && e.startAt >= start.getTime() && e.startAt <= end.getTime())
      .sort((a, b) => a.startAt - b.startAt);
  }, [userId, day], []);
}