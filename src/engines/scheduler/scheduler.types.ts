export type ScheduleStatus = "scheduled" | "completed" | "cancelled";

export interface ScheduleEvent {
  id: string;
  taskId: string;
  userId: string;
  title: string;
  description?: string;
  startAt: number;
  endAt: number;
  status: ScheduleStatus;
  isPinned: boolean;
  color?: string;
  createdAt: number;
  updatedAt: number;
}