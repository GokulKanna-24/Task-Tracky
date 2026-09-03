import { db } from "@/database/db";
import type { TimeEntry } from "./time.types";
import { durationSeconds, isSameDay } from "@/shared/utils/time";

export function calculateDuration(startedAt: number, endedAt: number | null): number {
  return durationSeconds(startedAt, endedAt);
}

export function sumEntries(entries: TimeEntry[]): number {
  return entries.reduce((s, e) => s + calculateDuration(e.startedAt, e.endedAt), 0);
}

export async function calculateTaskTotalTime(taskId: string): Promise<number> {
  const entries = await db.timeEntries.where("taskId").equals(taskId).toArray();
  return sumEntries(entries);
}

export async function calculateUserTotalTime(userId: string): Promise<number> {
  const entries = await db.timeEntries.where("userId").equals(userId).toArray();
  return sumEntries(entries);
}

export async function calculateDailyWorkingTime(userId: string, day: number): Promise<number> {
  const entries = await db.timeEntries.where("userId").equals(userId).toArray();
  return sumEntries(entries.filter((e) => isSameDay(e.startedAt, day)));
}

export async function calculateDailyBreakTime(userId: string, day: number): Promise<number> {
  const breaks = await db.breakEntries.where("userId").equals(userId).toArray();
  return breaks
    .filter((b) => isSameDay(b.startedAt, day))
    .reduce((s, b) => s + (b.endedAt ? Math.floor((b.endedAt - b.startedAt) / 1000) : Math.floor((Date.now() - b.startedAt) / 1000)), 0);
}