import { db } from "@/database/db";
import { schedulerRepository, makeScheduleEvent } from "./scheduler.repository";
import { timelineEngine } from "@/engines/timeline";
import { formatDateTime } from "@/shared/utils/time";
import type { ScheduleEvent } from "./scheduler.types";

export interface CreateScheduleInput {
  taskId: string;
  userId: string;
  title: string;
  description?: string;
  startAt: number;
  endAt: number;
  isPinned?: boolean;
  color?: string;
}

export interface ScheduleConflict {
  event: ScheduleEvent;
  overlapMs: number;
}

class SchedulerEngine {
  async create(input: CreateScheduleInput, actorId: string): Promise<ScheduleEvent> {
    if (input.endAt <= input.startAt) throw new Error("End time must be after start time");
    const event = makeScheduleEvent({
      ...input,
      status: "scheduled",
      isPinned: input.isPinned ?? false,
    });
    await db.transaction("rw", db.scheduleEvents, db.timelineEvents, async () => {
      await db.scheduleEvents.add(event);
      await timelineEngine.record(event.taskId, actorId, "task_scheduled", `Task scheduled for ${formatDateTime(event.startAt)}`, { startAt: event.startAt });
    });
    return event;
  }

  async reschedule(id: string, startAt: number, endAt: number, actorId: string): Promise<ScheduleEvent> {
    const existing = await schedulerRepository.get(id);
    if (!existing) throw new Error("Schedule event not found");
    if (endAt <= startAt) throw new Error("End time must be after start time");
    const updated: ScheduleEvent = { ...existing, startAt, endAt, updatedAt: now2() };
    await db.transaction("rw", db.scheduleEvents, db.timelineEvents, async () => {
      await db.scheduleEvents.put(updated);
      await timelineEngine.record(existing.taskId, actorId, "task_rescheduled", `Task rescheduled from ${formatDateTime(existing.startAt)} to ${formatDateTime(startAt)}`, { from: existing.startAt, to: startAt });
    });
    return updated;
  }

  async resize(id: string, endAt: number, actorId: string): Promise<ScheduleEvent> {
    const existing = await schedulerRepository.get(id);
    if (!existing) throw new Error("Schedule event not found");
    if (endAt <= existing.startAt) throw new Error("End time must be after start time");
    const updated: ScheduleEvent = { ...existing, endAt, updatedAt: now2() };
    await db.transaction("rw", db.scheduleEvents, db.timelineEvents, async () => {
      await db.scheduleEvents.put(updated);
      await timelineEngine.record(existing.taskId, actorId, "schedule_time_changed", `Schedule end changed to ${formatDateTime(endAt)}`, { endAt });
    });
    return updated;
  }

  async update(id: string, changes: Partial<ScheduleEvent>, actorId: string): Promise<void> {
    await db.transaction("rw", db.scheduleEvents, db.timelineEvents, async () => {
      await schedulerRepository.update(id, changes);
      await timelineEngine.record((await schedulerRepository.get(id))!.taskId, actorId, "updated", "Schedule updated");
    });
  }

  async cancel(id: string, actorId: string): Promise<void> {
    const existing = await schedulerRepository.get(id);
    if (!existing) return;
    await db.transaction("rw", db.scheduleEvents, db.timelineEvents, async () => {
      await schedulerRepository.update(id, { status: "cancelled" });
      await timelineEngine.record(existing.taskId, actorId, "task_unscheduled", "Schedule cancelled");
    });
  }

  async delete(id: string, actorId: string): Promise<void> {
    const existing = await schedulerRepository.get(id);
    if (!existing) return;
    await db.transaction("rw", db.scheduleEvents, db.timelineEvents, async () => {
      await db.scheduleEvents.delete(id);
      await timelineEngine.record(existing.taskId, actorId, "task_unscheduled", "Schedule removed");
    });
  }

  async pin(id: string, actorId: string): Promise<void> {
    const existing = await schedulerRepository.get(id);
    if (!existing) return;
    await db.transaction("rw", db.scheduleEvents, db.timelineEvents, async () => {
      await schedulerRepository.update(id, { isPinned: true });
      await timelineEngine.record(existing.taskId, actorId, "schedule_pinned", "Schedule pinned");
    });
  }

  async unpin(id: string, actorId: string): Promise<void> {
    const existing = await schedulerRepository.get(id);
    if (!existing) return;
    await db.transaction("rw", db.scheduleEvents, db.timelineEvents, async () => {
      await schedulerRepository.update(id, { isPinned: false });
      await timelineEngine.record(existing.taskId, actorId, "schedule_unpinned", "Schedule unpinned");
    });
  }

  async getByTask(taskId: string): Promise<ScheduleEvent[]> {
    return schedulerRepository.byTask(taskId);
  }
  async list(): Promise<ScheduleEvent[]> {
    return schedulerRepository.list();
  }
  async inRange(start: number, end: number): Promise<ScheduleEvent[]> {
    return schedulerRepository.inRange(start, end);
  }

  async detectConflicts(userId: string, startAt: number, endAt: number, excludeId?: string): Promise<ScheduleConflict[]> {
    const events = (await schedulerRepository.byUser(userId)).filter((e) => e.status === "scheduled" && e.id !== excludeId);
    const conflicts: ScheduleConflict[] = [];
    for (const e of events) {
      const overlapStart = Math.max(startAt, e.startAt);
      const overlapEnd = Math.min(endAt, e.endAt);
      const overlap = overlapEnd - overlapStart;
      if (overlap > 0) conflicts.push({ event: e, overlapMs: overlap });
    }
    return conflicts;
  }
}

import { now as now2 } from "@/shared/utils/time";
export const schedulerEngine = new SchedulerEngine();