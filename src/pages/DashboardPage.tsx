import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useScheduleForDay } from "@/hooks/useScheduleEvents";
import { useTasks } from "@/hooks/useTasks";
import { useRecentTimeline } from "@/hooks/useTaskTimeline";
import { db } from "@/database/db";
import { useLiveQuery } from "dexie-react-hooks";
import { formatTime, formatDuration, startOfDay, isSameDay, addDays } from "@/shared/utils/time";
import { timeEngine } from "@/engines/time";
import { workloadLevel } from "@/engines/scheduler/scheduler.calculations";
import { useSettings } from "@/hooks/useSettings";
import { Pin, Clock, CheckCircle2, ListChecks, Coffee, Calendar, ArrowRight, Activity } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { settings } = useSettings();
  const today = startOfDay(Date.now());
  const schedule = useScheduleForDay(user?.id, today);
  const tasks = useTasks();
  const timeline = useRecentTimeline(8);
  const projects = useProjects();
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(i); }, []);

  const userId = user?.id ?? "";
  const timeTotalToday = useLiveQuery(async () => {
    if (!userId) return 0;
    const entries = await db.timeEntries.where("userId").equals(userId).toArray();
    return entries.filter((e) => isSameDay(e.startedAt, Date.now())).reduce((s, e) => {
      const end = e.endedAt ?? Date.now();
      return s + Math.max(0, Math.floor((end - e.startedAt) / 1000));
    }, 0);
  }, [userId], 0);
  const breakToday = useLiveQuery(async () => {
    if (!userId) return 0;
    const breaks = await db.breakEntries.where("userId").equals(userId).toArray();
    return breaks.filter((b) => isSameDay(b.startedAt, Date.now())).reduce((s, b) => s + (b.endedAt ? Math.floor((b.endedAt - b.startedAt) / 1000) : Math.floor((Date.now() - b.startedAt) / 1000)), 0);
  }, [userId], 0);

  const plannedSeconds = schedule.reduce((s, e) => s + Math.floor((e.endAt - e.startAt) / 1000), 0);
  const completedToday = tasks.filter((t) => t.status === "completed").length;
  const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
  const pinned = schedule.filter((e) => e.isPinned).length;
  const workload = settings ? workloadLevel(plannedSeconds / 3600, settings.workloadThresholds) : "free";

  const now = Date.now();
  const nextEvent = schedule.find((e) => e.startAt > now);
  const nextTask = nextEvent ? tasks.find((t) => t.id === nextEvent.taskId) : null;
  const startsIn = nextEvent ? Math.max(0, Math.floor((nextEvent.startAt - now) / 60000)) : null;

  const stats = [
    { label: "Planned", value: formatDuration(plannedSeconds), icon: Calendar },
    { label: "Tracked", value: formatDuration(timeTotalToday), icon: Clock },
    { label: "Remaining", value: formatDuration(Math.max(0, plannedSeconds - timeTotalToday)), icon: Activity },
    { label: "Active", value: String(activeTasks), icon: ListChecks },
    { label: "Completed", value: String(completedToday), icon: CheckCircle2 },
    { label: "Pinned", value: String(pinned), icon: Pin },
    { label: "Break", value: formatDuration(breakToday), icon: Coffee },
    { label: "Workload", value: workload, icon: Activity },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><s.icon className="h-4 w-4" /><span className="text-xs">{s.label}</span></div>
            <p className="mt-1 text-xl font-semibold capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Today's Schedule</h2>
            <button onClick={() => navigate("/scheduler")} className="text-xs text-primary hover:underline inline-flex items-center gap-1">Open scheduler <ArrowRight className="h-3 w-3" /></button>
          </div>
          {schedule.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No scheduled work for today.</p>
          ) : (
            <div className="space-y-2">
              {schedule.map((e) => {
                const task = tasks.find((t) => t.id === e.taskId);
                return (
                  <button key={e.id} onClick={() => task && navigate(`/tasks/${task.id}`)} className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left hover:bg-muted/40">
                    {e.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                    <span className="w-16 text-xs font-medium text-muted-foreground tabular-nums">{formatTime(e.startAt)}</span>
                    <span className="flex-1 truncate text-sm font-medium">{e.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDuration(Math.floor((e.endAt - e.startAt) / 1000))}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3">Next task</h2>
          {nextEvent && nextTask ? (
            <div>
              <p className="text-sm font-medium">{nextTask.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">Starts in {startsIn != null ? `${Math.floor(startsIn / 60)}h ${startsIn % 60}m` : "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatTime(nextEvent.startAt)} · {formatDuration(Math.floor((nextEvent.endAt - nextEvent.startAt) / 1000))}</p>
              <button onClick={() => navigate(`/tasks/${nextTask.id}`)} className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">Open task <ArrowRight className="h-3 w-3" /></button>
            </div>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Nothing upcoming.</p>}

          <h3 className="mt-5 mb-2 text-sm font-semibold">Recent activity</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {timeline.map((ev) => (
              <div key={ev.id} className="text-xs">
                <span className="text-muted-foreground tabular-nums">{new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="ml-2">{ev.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}