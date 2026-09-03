import { startOfWeek, addDays, startOfDay, isSameDay } from "@/shared/utils/time";
import type { ScheduleEvent } from "@/engines/scheduler/scheduler.types";
import { EventBlock, HOUR_PX } from "./EventBlock";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekView({
  anchor,
  events,
  hourStart,
  hourEnd,
  weekStartsOn,
  onSlotClick,
  onEventClick,
}: {
  anchor: number;
  events: ScheduleEvent[];
  hourStart: number;
  hourEnd: number;
  weekStartsOn: number;
  onSlotClick: (date: string, start: string) => void;
  onEventClick: (e: ScheduleEvent) => void;
}) {
  const ws = startOfWeek(anchor, weekStartsOn);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const hours = Array.from({ length: hourEnd - hourStart }, (_, i) => hourStart + i);
  const today = Date.now();

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
          <div />
          {days.map((d) => (
            <div key={d} className={cn("px-2 py-2 text-center", isSameDay(d, today) && "bg-primary/5")}>
              <p className="text-xs text-muted-foreground">{DAY_LABELS[new Date(d).getDay()]}</p>
              <p className={cn("text-lg font-semibold", isSameDay(d, today) && "text-primary")}>{new Date(d).getDate()}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          <div className="relative">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_PX }} className="relative border-b pr-2 text-right">
                <span className="absolute -top-2 right-1 text-[10px] text-muted-foreground tabular-nums">{h}:00</span>
              </div>
            ))}
          </div>
          {days.map((d) => {
            const dayStart = startOfDay(d);
            const dayEvents = events.filter((e) => isSameDay(e.startAt, d));
            return (
              <div key={d} className="relative border-l">
                {hours.map((h) => (
                  <button
                    key={h}
                    style={{ height: HOUR_PX }}
                    onClick={() => {
                      const date = new Date(d).toISOString().slice(0, 10);
                      const start = `${String(h).padStart(2, "0")}:00`;
                      onSlotClick(date, start);
                    }}
                    className="block w-full border-b hover:bg-primary/5"
                  />
                ))}
                {dayEvents.map((e) => (
                  <EventBlock key={e.id} event={e} dayStart={dayStart} hourStart={hourStart} hourEnd={hourEnd} onClick={onEventClick} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}