import { db } from "@/database/db";
import type { ScheduleEvent } from "./scheduler.types";
import { isSameDay, startOfDay, addDays } from "@/shared/utils/time";
import type { AppSettings } from "@/engines/settings.types";

export interface DayWorkload {
  date: number;
  plannedSeconds: number;
  level: "light" | "moderate" | "heavy" | "overloaded" | "free";
}

export function workloadLevel(plannedHours: number, thresholds: AppSettings["workloadThresholds"]): DayWorkload["level"] {
  if (plannedHours <= 0) return "free";
  if (plannedHours >= thresholds.overloaded) return "overloaded";
  if (plannedHours >= thresholds.heavy) return "heavy";
  if (plannedHours >= thresholds.moderate) return "moderate";
  return "light";
}

export function eventDurationSeconds(event: ScheduleEvent): number {
  return Math.max(0, Math.floor((event.endAt - event.startAt) / 1000));
}

export async function getDailyWorkload(userId: string, day: number, thresholds: AppSettings["workloadThresholds"]): Promise<DayWorkload> {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  const events = (await db.scheduleEvents.where("userId").equals(userId).toArray()).filter(
    (e) => e.status === "scheduled" && e.startAt >= dayStart && e.startAt < dayEnd,
  );
  const plannedSeconds = events.reduce((s, e) => s + eventDurationSeconds(e), 0);
  return {
    date: dayStart,
    plannedSeconds,
    level: workloadLevel(plannedSeconds / 3600, thresholds),
  };
}

export async function getWeeklyWorkload(userId: string, weekStart: number, thresholds: AppSettings["workloadThresholds"]): Promise<DayWorkload[]> {
  const days: DayWorkload[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(await getDailyWorkload(userId, addDays(weekStart, i), thresholds));
  }
  return days;
}

export async function getUpcomingSchedule(userId: string, from: number, days: number): Promise<ScheduleEvent[]> {
  const end = addDays(startOfDay(from), days);
  const events = (await db.scheduleEvents.where("userId").equals(userId).toArray()).filter(
    (e) => e.status === "scheduled" && e.startAt >= startOfDay(from) && e.startAt < end,
  );
  return events.sort((a, b) => a.startAt - b.startAt);
}