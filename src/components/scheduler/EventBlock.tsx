import { Pin } from "lucide-react";
import type { ScheduleEvent } from "@/engines/scheduler/scheduler.types";
import { formatTime, formatDuration } from "@/shared/utils/time";
import { cn } from "@/lib/utils";

const HOUR_PX = 56;

export function eventBoxStyle(event: ScheduleEvent, dayStart: number, hourStart: number, hourEnd: number) {
  const winStart = dayStart + hourStart * 3600000;
  const winEnd = dayStart + hourEnd * 3600000;
  const s = Math.max(event.startAt, winStart);
  const e = Math.min(event.endAt, winEnd);
  if (e <= s) return null;
  const top = ((s - winStart) / 3600000) * HOUR_PX;
  const height = Math.max(18, ((e - s) / 3600000) * HOUR_PX - 2);
  return { top, height };
}

export function EventBlock({
  event,
  dayStart,
  hourStart,
  hourEnd,
  onClick,
}: {
  event: ScheduleEvent;
  dayStart: number;
  hourStart: number;
  hourEnd: number;
  onClick: (e: ScheduleEvent) => void;
}) {
  const box = eventBoxStyle(event, dayStart, hourStart, hourEnd);
  if (!box) return null;
  return (
    <button
      onClick={() => onClick(event)}
      style={{ top: box.top, height: box.height }}
      className={cn(
        "absolute left-1 right-1 z-10 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm transition-shadow hover:shadow-md",
        event.isPinned ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40" : "border-primary/30 bg-primary/10",
      )}
    >
      <div className="flex items-center gap-1 font-medium">
        {event.isPinned && <Pin className="h-3 w-3 shrink-0 text-amber-500" />}
        <span className="truncate">{event.title}</span>
      </div>
      <p className="text-[10px] text-muted-foreground tabular-nums">
        {formatTime(event.startAt)} – {formatTime(event.endAt)}
      </p>
    </button>
  );
}

export { HOUR_PX };