import type { User } from "@/engines/user.types";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskSource = "manual" | "bucket";

export interface Task {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedUserIds: string[];
  labels: string[];
  dueDate: number | null;
  createdAt: number;
  updatedAt: number;
  assignedAt: number | null;
  source: TaskSource;
  bucketItemId?: string;
}

export const TASK_STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "completed"];
export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export interface TaskWithMeta extends Task {
  assignees: User[];
  timeTotalSeconds: number;
  activeTimerSeconds: number;
  hasActiveTimer: boolean;
  commentsCount: number;
  timelineCount: number;
  progress: number; // 0-100
}