// Orchestration services coordinating multiple engines within transactions.
import { db } from "@/database/db";
import { taskEngine } from "@/engines/task";
import { schedulerEngine } from "@/engines/scheduler";
import { timelineEngine } from "@/engines/timeline";
import type { TaskPriority, TaskStatus } from "@/engines/task/task.types";

export interface CreateScheduledTaskInput {
  title: string;
  description?: string;
  projectId?: string | null;
  priority?: TaskPriority;
  assignedUserIds?: string[];
  labels?: string[];
  startAt: number;
  endAt: number;
  isPinned?: boolean;
}

class TaskSchedulingService {
  async createScheduledTask(input: CreateScheduledTaskInput, actorId: string) {
    return db.transaction("rw", db.tasks, db.scheduleEvents, db.timelineEvents, async () => {
      const task = await taskEngine.create(
        {
          title: input.title,
          description: input.description,
          projectId: input.projectId,
          priority: input.priority,
          assignedUserIds: input.assignedUserIds,
          labels: input.labels,
          status: "todo",
        },
        actorId,
      );
      const event = await schedulerEngine.create(
        {
          taskId: task.id,
          userId: actorId,
          title: task.title,
          description: task.description,
          startAt: input.startAt,
          endAt: input.endAt,
          isPinned: input.isPinned,
        },
        actorId,
      );
      return { task, event };
    });
  }

  async scheduleExistingTask(taskId: string, startAt: number, endAt: number, actorId: string, isPinned = false) {
    const task = await db.tasks.get(taskId);
    if (!task) throw new Error("Task not found");
    const conflicts = await schedulerEngine.detectConflicts(actorId, startAt, endAt);
    const event = await schedulerEngine.create(
      { taskId, userId: actorId, title: task.title, description: task.description, startAt, endAt, isPinned },
      actorId,
    );
    return { event, conflicts };
  }
}

export const taskSchedulingService = new TaskSchedulingService();