import { db } from "@/database/db";
import { timelineEngine } from "@/engines/timeline";
import { timeRepository, makeTimeEntry, makeBreakEntry, entryDuration } from "./time.repository";
import type { TimeEntry, BreakEntry } from "./time.types";
import { now, formatDuration } from "@/shared/utils/time";

export interface StartResult {
  ok: boolean;
  activeEntry?: TimeEntry;
  newEntry?: TimeEntry;
  message?: string;
}

class TimeEngine {
  async start(taskId: string, userId: string): Promise<StartResult> {
    const active = await timeRepository.getActiveForUser(userId);
    if (active) {
      return {
        ok: false,
        activeEntry: active,
        message: "You already have an active timer.",
      };
    }
    const entry = makeTimeEntry(taskId, userId);
    await db.transaction("rw", db.timeEntries, db.timelineEvents, async () => {
      await db.timeEntries.add(entry);
      await timelineEngine.record(taskId, userId, "timer_started", "Timer started");
    });
    return { ok: true, newEntry: entry };
  }

  async pause(taskId: string, userId: string): Promise<TimeEntry | undefined> {
    const active = await timeRepository.getActiveForUser(userId);
    if (!active || active.taskId !== taskId) return undefined;
    const ts = now();
    const elapsed = entryDuration({ ...active, endedAt: ts });
    const updated: TimeEntry = { ...active, status: "completed", endedAt: ts, durationSeconds: elapsed };
    await db.transaction("rw", db.timeEntries, db.timelineEvents, async () => {
      await db.timeEntries.put(updated);
      await timelineEngine.record(taskId, userId, "timer_paused", `Timer paused after ${formatDuration(elapsed)}`);
    });
    return updated;
  }

  async resume(taskId: string, userId: string): Promise<StartResult> {
    // Resume is semantically a new running entry continuing the work.
    return this.start(taskId, userId);
  }

  async stop(taskId: string, userId: string): Promise<TimeEntry | undefined> {
    return this.pause(taskId, userId);
  }

  async getByTask(taskId: string): Promise<TimeEntry[]> {
    return timeRepository.getByTask(taskId);
  }

  async getByUser(userId: string): Promise<TimeEntry[]> {
    return timeRepository.getByUser(userId);
  }

  async getActive(): Promise<TimeEntry[]> {
    return timeRepository.getActive();
  }

  async getTaskTotalTime(taskId: string): Promise<number> {
    const entries = await this.getByTask(taskId);
    return entries.reduce((sum, e) => sum + entryDuration(e), 0);
  }

  async getUserTaskTime(userId: string, taskId: string): Promise<number> {
    const entries = await this.getByUser(userId);
    return entries.filter((e) => e.taskId === taskId).reduce((sum, e) => sum + entryDuration(e), 0);
  }

  // Breaks
  async startBreak(userId: string): Promise<BreakEntry> {
    const existing = await timeRepository.getActiveBreakForUser(userId);
    if (existing) return existing;
    const entry = makeBreakEntry(userId);
    await db.breakEntries.add(entry);
    return entry;
  }

  async endBreak(userId: string): Promise<BreakEntry | undefined> {
    const active = await timeRepository.getActiveBreakForUser(userId);
    if (!active) return undefined;
    const ts = now();
    const elapsed = Math.max(0, Math.floor((ts - active.startedAt) / 1000));
    const updated: BreakEntry = { ...active, status: "completed", endedAt: ts, durationSeconds: elapsed };
    await db.breakEntries.put(updated);
    return updated;
  }

  async getDailyBreakTime(userId: string, dayStart: number): Promise<number> {
    const breaks = await timeRepository.getBreaksByUser(userId);
    return breaks
      .filter((b) => (b.endedAt ?? now()) >= dayStart && b.startedAt < dayStart + 86400000)
      .reduce((sum, b) => sum + (b.status === "running" ? Math.floor((now() - b.startedAt) / 1000) : b.durationSeconds), 0);
  }
}

export const timeEngine = new TimeEngine();