import { cn } from "@/lib/utils";
import { STATUS_LABELS, type TaskStatus } from "@/engines/task/task.types";

const statusStyles: Record<TaskStatus, string> = {
  backlog: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  todo: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  review: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}