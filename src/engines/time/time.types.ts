export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number;
  status: "running" | "completed";
}

export interface BreakEntry {
  id: string;
  userId: string;
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number;
  status: "running" | "completed";
}