import { startOfDay, isSameDay, formatTime, formatDuration } from "@/shared/utils/time";
import type { ScheduleEvent } from "@/engines/scheduler/scheduler.types";
import { EventBlock, HOUR_PX } from "./EventBlock";
import { Pin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DayView({
  anchor,
  events,
  hourStart,
  hourEnd,
  onSlotClick,
  onEventClick,
}: {
  anchor: number;
  events: ScheduleEvent[];
  hourStart: number;
  hourEnd: number;
  onSlotClick: (date: string, start: string) => void;
  onEventClick: (e: ScheduleEvent) => void;
}) {
  const hours = Array.from({ length: hourEnd - hourStart }, (_, i) => hourStart + i);
  const dayStart = startOfDay(anchor);
  const dayEvents = events.filter((e) => isSameDay(e.startAt, anchor));
  const date = new Date(anchor).toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">
          {new Date(anchor).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <p className="text-xs text-muted-foreground">{dayEvents.length} scheduled · {formatDuration(dayEvents.reduce((s, e) => s + Math.floor((e.endAt - e.startAt) / 1000), 0))} planned</p>
      </div>
      <div className="grid grid-cols-[60px_1fr]">
        <div className="relative">
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_PX }} className="relative border-b pr-2 text-right">
              <span className="absolute -top-2 right-1 text-[10px] text-muted-foreground tabular-nums">{h}:00</span>
            </div>
          ))}
        </div>
        <div className="relative border-l">
          {hours.map((h) => (
            <button
              key={h}
              style={{ height: HOUR_PX }}
              onClick={() => onSlotClick(date, `${String(h).padStart(2, "0")}:00`)}
              className="block w-full border-b hover:bg-primary/5"
            />
          ))}
          {dayEvents.map((e) => (
            <EventBlock key={e.id} event={e} dayStart={dayStart} hourStart={hourStart} hourEnd={hourEnd} onClick={onEventClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EventDetailSheet({ event, onClose, onDelete, onTogglePin }: {
  event: ScheduleEvent;
  onClose: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-xl bg-card p-5 shadow-lg sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold">{event.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">{formatTime(event.startAt)} – {formatTime(event.endAt)}</p>
        <p className="text-sm text-muted-foreground">{formatDuration(Math.floor((event.endAt - event.startAt) / 1000))}</p>
        <div className="mt-4 flex gap-2">
          <button onClick={onTogglePin} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            <Pin className={cn("h-4 w-4", event.isPinned && "fill-amber-400 text-amber-500")} /> {event.isPinned ? "Unpin" : "Pin"}
          </button>
          <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}