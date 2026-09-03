import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/database/db";
import type { Task, TaskStatus } from "@/engines/task/task.types";
import type { TimeEntry } from "@/engines/time/time.types";

export interface TaskFilters {
  status?: TaskStatus | "all";
  projectId?: string | "all";
  assigneeId?: string | "all";
  label?: string;
  search?: string;
}

export function useTasks(filters?: TaskFilters) {
  return useLiveQuery(async () => {
    let tasks = await db.tasks.toArray();
    const f = filters ?? {};
    if (f.status && f.status !== "all") tasks = tasks.filter((t) => t.status === f.status);
    if (f.projectId && f.projectId !== "all") tasks = tasks.filter((t) => t.projectId === f.projectId);
    if (f.assigneeId && f.assigneeId !== "all") tasks = tasks.filter((t) => t.assignedUserIds.includes(f.assigneeId!));
    if (f.label) tasks = tasks.filter((t) => t.labels.includes(f.label!));
    if (f.search) {
      const q = f.search.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  }, [JSON.stringify(filters)], []);
}

export function useTask(taskId: string | undefined) {
  return useLiveQuery(async () => (taskId ? await db.tasks.get(taskId) : undefined), [taskId]);
}

export function useTaskTimeEntries(taskId: string | undefined) {
  return useLiveQuery(async () => (taskId ? await db.timeEntries.where("taskId").equals(taskId).toArray() : []), [taskId], []);
}

export function useTaskTotalTime(taskId: string | undefined) {
  const entries = useTaskTimeEntries(taskId);
  if (!taskId || !entries) return { totalSeconds: 0, active: false, activeSeconds: 0 };
  const now = Date.now();
  let totalSeconds = 0;
  let activeSeconds = 0;
  let active = false;
  for (const e of entries) {
    const end = e.endedAt ?? now;
    const secs = Math.max(0, Math.floor((end - e.startedAt) / 1000));
    totalSeconds += secs;
    if (e.status === "running") {
      active = true;
      activeSeconds = secs;
    }
  }
  return { totalSeconds, active, activeSeconds };
}

export function useActiveTimer(userId: string | null | undefined) {
  return useLiveQuery(async () => {
    if (!userId) return undefined;
    const running = await db.timeEntries.where("status").equals("running").toArray();
    return running.find((e) => e.userId === userId);
  }, [userId]);
}