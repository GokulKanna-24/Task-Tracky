// Time + duration utilities. All internal time is numeric Unix milliseconds.
// Durations are canonicalized as seconds. Display helpers format for UI only.

export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;

export function now(): number {
  return Date.now();
}

export function durationSeconds(startedAt: number, endedAt: number | null): number {
  const end = endedAt ?? now();
  return Math.max(0, Math.floor((end - startedAt) / MS_PER_SECOND));
}

export function secondsToHoursMinutes(seconds: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  return {
    hours: Math.floor(totalMinutes / SECONDS_PER_MINUTE),
    minutes: totalMinutes % SECONDS_PER_MINUTE,
  };
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "00m";
  const { hours, minutes } = secondsToHoursMinutes(seconds);
  const remainingSeconds = seconds % SECONDS_PER_MINUTE;
  if (hours === 0 && minutes === 0) return `${remainingSeconds}s`;
  if (hours === 0) return `${pad2(minutes)}m`;
  if (minutes === 0) return `${pad2(hours)}h`;
  return `${pad2(hours)}h ${pad2(minutes)}m`;
}

export function formatDurationFull(seconds: number): string {
  const { hours, minutes } = secondsToHoursMinutes(seconds);
  const secs = seconds % SECONDS_PER_MINUTE;
  return `${pad2(hours)}h ${pad2(minutes)}m ${pad2(secs)}s`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatClock(seconds: number): string {
  const { hours, minutes } = secondsToHoursMinutes(seconds);
  const secs = seconds % SECONDS_PER_MINUTE;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`;
}

export function formatDate(timestamp: number | null): string {
  if (timestamp == null) return "—";
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(timestamp: number | null): string {
  if (timestamp == null) return "—";
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function startOfWeek(timestamp: number, weekStartsOn: number = 1): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * 24 * 60 * 60 * MS_PER_SECOND;
}

export function startOfMonth(timestamp: number): number {
  const d = new Date(timestamp);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysInMonth(timestamp: number): number {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}