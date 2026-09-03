import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSettings } from "@/hooks/useSettings";
import { useScheduleInRange } from "@/hooks/useScheduleEvents";
import { schedulerEngine } from "@/engines/scheduler";
import { startOfMonth, addDays, startOfWeek, startOfDay } from "@/shared/utils/time";
import { WeekView } from "@/components/scheduler/WeekView";
import { DayView, EventDetailSheet } from "@/components/scheduler/DayView";
import { MonthView } from "@/components/scheduler/MonthView";
import { ScheduleEventDialog } from "@/components/scheduler/ScheduleEventDialog";
import { Calendar, ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/engines/scheduler/scheduler.types";
import { toast } from "sonner";

type View = "month" | "week" | "day";

export default function SchedulerPage() {
  const { user } = useCurrentUser();
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const view = (params.get("view") as View) || "week";
  const setView = (v: View) => setParams({ view: v });

  const [anchor, setAnchor] = useState(Date.now());
  const [dialog, setDialog] = useState<{ date: string; start: string } | null>(null);
  const [selected, setSelected] = useState<ScheduleEvent | null>(null);

  const rangeStart = startOfMonth(anchor) - 7 * 86400000;
  const rangeEnd = startOfMonth(anchor) + 60 * 86400000;
  const events = useScheduleInRange(rangeStart, rangeEnd);
  const hourStart = settings?.workingDayStart ?? 9;
  const hourEnd = settings?.workingDayEnd ?? 18;
  const weekStartsOn = settings?.weekStartsOn ?? 1;

  const move = (dir: number) => {
    if (view === "month") setAnchor(startOfMonth(addDays(startOfMonth(anchor), dir * 31)));
    else if (view === "week") setAnchor(startOfWeek(addDays(anchor, dir * 7), weekStartsOn));
    else setAnchor(addDays(startOfDay(anchor), dir));
  };
  const goToday = () => setAnchor(Date.now());

  const label = (() => {
    if (view === "month") return new Date(anchor).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    if (view === "week") {
      const ws = startOfWeek(anchor, weekStartsOn);
      const we = addDays(ws, 6);
      return `${new Date(ws).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(we).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    }
    return new Date(anchor).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  })();

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">Scheduler</h1>
          <p className="text-sm text-muted-foreground">Plan your time and manage your calendar.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted">Today</button>
          <div className="inline-flex rounded-lg border">
            <button onClick={() => move(-1)} className="px-2.5 py-2 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => move(1)} className="border-l px-2.5 py-2 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="inline-flex rounded-lg border p-1">
            {(["month", "week", "day"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium capitalize", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{label}</h2>
        <button onClick={() => setDialog({ date: new Date().toISOString().slice(0, 10), start: `${String(hourStart).padStart(2, "0")}:00` })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New event
        </button>
      </div>

      {view === "month" && <MonthView anchor={anchor} events={events} weekStartsOn={weekStartsOn} onDayClick={(ts) => { setAnchor(ts); setView("day"); }} />}
      {view === "week" && <WeekView anchor={anchor} events={events} hourStart={hourStart} hourEnd={hourEnd} weekStartsOn={weekStartsOn} onSlotClick={(date, start) => setDialog({ date, start })} onEventClick={setSelected} />}
      {view === "day" && <DayView anchor={anchor} events={events} hourStart={hourStart} hourEnd={hourEnd} onSlotClick={(date, start) => setDialog({ date, start })} onEventClick={setSelected} />}

      {dialog && user && <ScheduleEventDialog initialDate={dialog.date} initialStart={dialog.start} userId={user.id} onClose={() => setDialog(null)} />}
      {selected && (
        <EventDetailSheet
          event={selected}
          onClose={() => setSelected(null)}
          onDelete={async () => {
            await schedulerEngine.delete(selected.id, user?.id ?? "");
            toast.success("Event deleted.");
            setSelected(null);
          }}
          onTogglePin={async () => {
            if (selected.isPinned) await schedulerEngine.unpin(selected.id, user?.id ?? "");
            else await schedulerEngine.pin(selected.id, user?.id ?? "");
            toast.success(selected.isPinned ? "Unpinned." : "Pinned.");
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}