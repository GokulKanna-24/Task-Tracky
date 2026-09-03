import { Play, Pause, Square } from "lucide-react";
import { useTaskTimer } from "@/hooks/useTaskTimer";
import { useTaskTotalTime } from "@/hooks/useTasks";
import { formatClock } from "@/shared/utils/time";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TaskTimer({ taskId, userId, compact = false }: { taskId: string; userId: string | null | undefined; compact?: boolean }) {
  const { start, pause, resume, stop, isRunningOnThis, isRunningOnOther } = useTaskTimer(taskId, userId);
  const { totalSeconds, active, activeSeconds } = useTaskTotalTime(taskId);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [active]);

  const liveSeconds = active ? activeSeconds : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {!active && (
          <button onClick={start} className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950" title="Start timer">
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        )}
        {active && (
          <>
            <button onClick={pause} className="rounded-md p-1.5 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950" title="Pause">
              <Pause className="h-3.5 w-3.5" />
            </button>
            <button onClick={stop} className="rounded-md p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-950" title="Stop">
              <Square className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Timer</p>
          <p className={cn("font-mono text-lg font-semibold tabular-nums", active && "text-emerald-600 dark:text-emerald-400")}>
            {formatClock(liveSeconds)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {!active && (
            <button onClick={start} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
              <Play className="h-3.5 w-3.5 fill-current" /> Start
            </button>
          )}
          {active && (
            <button onClick={pause} className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          {active && (
            <button onClick={stop} className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          )}
        </div>
      </div>
      {isRunningOnOther && !active && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Another timer is already running.</p>
      )}
    </div>
  );
}