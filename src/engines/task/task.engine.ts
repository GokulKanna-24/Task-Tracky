import { db } from "@/database/db";
import { taskRepository } from "./task.repository";
import { timelineEngine } from "@/engines/timeline";
import type { Task, TaskStatus, TaskPriority } from "./task.types";
import { createTaskId } from "@/shared/utils/ids";
import { now } from "@/shared/utils/time";

export interface CreateTaskInput {
  projectId?: string | null;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserIds?: string[];
  labels?: string[];
  dueDate?: number | null;
  source?: "manual" | "bucket";
  bucketItemId?: string;
}

class TaskEngine {
  async create(input: CreateTaskInput, userId: string): Promise<Task> {
    const ts = now();
    const task: Task = {
      id: createTaskId(),
      projectId: input.projectId ?? null,
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      assignedUserIds: input.assignedUserIds ?? [],
      labels: input.labels ?? [],
      dueDate: input.dueDate ?? null,
      createdAt: ts,
      updatedAt: ts,
      assignedAt: input.assignedUserIds && input.assignedUserIds.length ? ts : null,
      source: input.source ?? "manual",
      bucketItemId: input.bucketItemId,
    };
    await db.transaction("rw", db.tasks, db.timelineEvents, async () => {
      await db.tasks.add(task);
      await timelineEngine.record(task.id, userId, "created", "Task created", { title: task.title });
    });
    return task;
  }

  async update(id: string, changes: Partial<Task>, userId: string): Promise<Task> {
    const existing = await db.tasks.get(id);
    if (!existing) throw new Error("Task not found");
    const updated: Task = { ...existing, ...changes, id, updatedAt: now() };
    await db.transaction("rw", db.tasks, db.timelineEvents, async () => {
      await db.tasks.put(updated);
      await timelineEngine.record(id, userId, "updated", "Task updated");
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.transaction("rw", [db.tasks, db.timelineEvents, db.timeEntries, db.comments, db.scheduleEvents, db.shareLinks], async () => {
      await db.tasks.delete(id);
      await db.timeEntries.where("taskId").equals(id).delete();
      await db.timelineEvents.where("taskId").equals(id).delete();
      await db.comments.where("taskId").equals(id).delete();
      await db.scheduleEvents.where("taskId").equals(id).delete();
      await db.shareLinks.where("taskId").equals(id).delete();
    });
  }

  async getById(id: string): Promise<Task | undefined> {
    return taskRepository.get(id);
  }

  async list(): Promise<Task[]> {
    return taskRepository.list();
  }

  async changeStatus(id: string, status: TaskStatus, userId: string): Promise<Task> {
    const existing = await db.tasks.get(id);
    if (!existing) throw new Error("Task not found");
    const type = status === "completed" ? "completed" : "status_changed";
    const message = status === "completed" ? "Task marked as completed" : `Status changed to ${status}`;
    await db.transaction("rw", db.tasks, db.timelineEvents, async () => {
      await db.tasks.put({ ...existing, status, updatedAt: now() });
      await timelineEngine.record(id, userId, type, message, { status });
    });
    return { ...existing, status };
  }

  async assign(id: string, userIds: string[], actorId: string): Promise<Task> {
    const existing = await db.tasks.get(id);
    if (!existing) throw new Error("Task not found");
    const ts = now();
    await db.transaction("rw", db.tasks, db.timelineEvents, async () => {
      await db.tasks.put({ ...existing, assignedUserIds: userIds, assignedAt: ts, updatedAt: ts });
      await timelineEngine.record(id, actorId, "assigned", "Task assigned", { userIds });
    });
    return { ...existing, assignedUserIds: userIds, assignedAt: ts };
  }

  async unassign(id: string, actorId: string): Promise<Task> {
    return this.assign(id, [], actorId);
  }
}

export const taskEngine = new TaskEngine();