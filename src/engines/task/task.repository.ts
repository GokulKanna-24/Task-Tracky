import { db } from "@/database/db";
import type { Task } from "./task.types";

export interface TaskQuery {
  projectId?: string | null;
  status?: string;
  assigneeId?: string;
  label?: string;
  search?: string;
}

export const taskRepository = {
  async get(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  },
  async list(): Promise<Task[]> {
    return db.tasks.toArray();
  },
  async byStatus(status: string): Promise<Task[]> {
    return db.tasks.where("status").equals(status).toArray();
  },
  async create(task: Task): Promise<Task> {
    await db.tasks.add(task);
    return task;
  },
  async update(id: string, changes: Partial<Task>): Promise<Task> {
    const existing = await db.tasks.get(id);
    if (!existing) throw new Error("Task not found");
    const updated = { ...existing, ...changes, id, updatedAt: Date.now() };
    await db.tasks.put(updated);
    return updated;
  },
  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
  },
  async put(task: Task): Promise<void> {
    await db.tasks.put(task);
  },
};