import { db } from "@/database/db";
import type { ScheduleEvent } from "./scheduler.types";
import { createScheduleEventId } from "@/shared/utils/ids";
import { now } from "@/shared/utils/time";

export const schedulerRepository = {
  async get(id: string) {
    return db.scheduleEvents.get(id);
  },
  async list(): Promise<ScheduleEvent[]> {
    return db.scheduleEvents.toArray();
  },
  async byTask(taskId: string): Promise<ScheduleEvent[]> {
    return db.scheduleEvents.where("taskId").equals(taskId).sortBy("startAt");
  },
  async byUser(userId: string): Promise<ScheduleEvent[]> {
    return db.scheduleEvents.where("userId").equals(userId).sortBy("startAt");
  },
  async inRange(start: number, end: number): Promise<ScheduleEvent[]> {
    return db.scheduleEvents.where("startAt").between(start, end, true, true).toArray();
  },
  async create(event: ScheduleEvent): Promise<void> {
    await db.scheduleEvents.add(event);
  },
  async put(event: ScheduleEvent): Promise<void> {
    await db.scheduleEvents.put(event);
  },
  async update(id: string, changes: Partial<ScheduleEvent>): Promise<void> {
    await db.scheduleEvents.update(id, { ...changes, updatedAt: now() });
  },
  async delete(id: string): Promise<void> {
    await db.scheduleEvents.delete(id);
  },
};

export function makeScheduleEvent(data: Omit<ScheduleEvent, "id" | "createdAt" | "updatedAt">): ScheduleEvent {
  const ts = now();
  return { ...data, id: createScheduleEventId(), createdAt: ts, updatedAt: ts };
}