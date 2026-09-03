export type TimelineEventType =
  | "created"
  | "updated"
  | "assigned"
  | "unassigned"
  | "status_changed"
  | "priority_changed"
  | "timer_started"
  | "timer_paused"
  | "timer_resumed"
  | "timer_stopped"
  | "comment_added"
  | "completed"
  | "task_scheduled"
  | "task_rescheduled"
  | "task_unscheduled"
  | "schedule_pinned"
  | "schedule_unpinned"
  | "schedule_time_changed"
  | "bucket_promoted";

export interface TimelineEvent {
  id: string;
  taskId: string;
  userId: string;
  type: TimelineEventType;
  timestamp: number;
  message: string;
  metadata?: Record<string, unknown>;
}