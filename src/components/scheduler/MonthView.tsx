import { startOfMonth, daysInMonth, startOfWeek, addDays, isSameDay } from "@/shared/utils/time";
import type { ScheduleEvent } from "@/engines/scheduler/scheduler.types";
import { cn } from "@/lib/utils";

export function MonthView({
  anchor,
  events,
  weekStartsOn,
  onDayClick,
}: {
  anchor: number;
  events: ScheduleEvent[];
  weekStartsOn: number;
  onDayClick: (ts: number) => void;
}) {
  const monthStart = startOfMonth(anchor);
  const total = daysInMonth(anchor);
  const gridStart = startOfWeek(monthStart, weekStartsOn);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = Date.now();
  const month = new Date(anchor).getMonth();

  return (
    <div className="rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const inMonth = new Date(d).getMonth() === month;
          const dayEvents = events.filter((e) => isSameDay(e.startAt, d)).slice(0, 3);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={d}
              onClick={() => onDayClick(d)}
              className={cn(
                "min-h-[88px] border-b border-r p-1.5 text-left align-top transition-colors hover:bg-muted/40",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <div className={cn("mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs", isToday && "bg-primary text-primary-foreground")}>
                {new Date(d).getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.map((e) => (
                  <div key={e.id} className={cn("truncate rounded px-1 py-0.5 text-[10px]", e.isPinned ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-primary/10 text-primary")}>
                    {e.title}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}