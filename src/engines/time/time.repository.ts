import { db } from "@/database/db";
import type { TimeEntry, BreakEntry } from "./time.types";
import { createTimeEntryId, createBreakEntryId } from "@/shared/utils/ids";
import { now, durationSeconds } from "@/shared/utils/time";

export const timeRepository = {
  async get(id: string) {
    return db.timeEntries.get(id);
  },
  async getByTask(taskId: string): Promise<TimeEntry[]> {
    return db.timeEntries.where("taskId").equals(taskId).toArray();
  },
  async getByUser(userId: string): Promise<TimeEntry[]> {
    return db.timeEntries.where("userId").equals(userId).toArray();
  },
  async getActive(): Promise<TimeEntry[]> {
    return db.timeEntries.where("status").equals("running").toArray();
  },
  async getActiveForUser(userId: string): Promise<TimeEntry | undefined> {
    const running = await db.timeEntries.where("status").equals("running").toArray();
    return running.find((e) => e.userId === userId);
  },
  async create(entry: TimeEntry): Promise<void> {
    await db.timeEntries.add(entry);
  },
  async update(id: string, changes: Partial<TimeEntry>): Promise<void> {
    await db.timeEntries.update(id, changes);
  },
  async put(entry: TimeEntry): Promise<void> {
    await db.timeEntries.put(entry);
  },
  // Breaks
  async getBreaksByUser(userId: string): Promise<BreakEntry[]> {
    return db.breakEntries.where("userId").equals(userId).toArray();
  },
  async getActiveBreakForUser(userId: string): Promise<BreakEntry | undefined> {
    const running = await db.breakEntries.where("status").equals("running").toArray();
    return running.find((b) => b.userId === userId);
  },
  async createBreak(entry: BreakEntry): Promise<void> {
    await db.breakEntries.add(entry);
  },
  async updateBreak(id: string, changes: Partial<BreakEntry>): Promise<void> {
    await db.breakEntries.update(id, changes);
  },
};

export function makeTimeEntry(taskId: string, userId: string, startedAt: number = now()): TimeEntry {
  return {
    id: createTimeEntryId(),
    taskId,
    userId,
    startedAt,
    endedAt: null,
    durationSeconds: 0,
    status: "running",
  };
}

export function makeBreakEntry(userId: string, startedAt: number = now()): BreakEntry {
  return {
    id: createBreakEntryId(),
    userId,
    startedAt,
    endedAt: null,
    durationSeconds: 0,
    status: "running",
  };
}

export function entryDuration(entry: TimeEntry): number {
  return durationSeconds(entry.startedAt, entry.endedAt);
}