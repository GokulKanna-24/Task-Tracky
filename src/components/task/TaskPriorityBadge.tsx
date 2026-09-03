import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, type TaskPriority } from "@/engines/task/task.types";

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function TaskPriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", priorityStyles[priority], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}