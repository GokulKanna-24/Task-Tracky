import { Clock, Play } from "lucide-react";
import { formatDuration } from "@/shared/utils/time";
import { cn } from "@/lib/utils";

export function TaskTimeSummary({ totalSeconds, active, className }: { totalSeconds: number; active?: boolean; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {active ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <Play className="h-3 w-3 fill-current" />
          Live
        </span>
      ) : (
        <Clock className="h-3 w-3" />
      )}
      <span className="tabular-nums">{formatDuration(totalSeconds)}</span>
    </div>
  );
}