import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/shared/utils/time";

export function TaskDueDate({ dueDate, className }: { dueDate: number | null; className?: string }) {
  if (dueDate == null) return null;
  const overdue = dueDate < Date.now();
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground", className)}>
      <Calendar className="h-3 w-3" />
      {formatDate(dueDate)}
    </span>
  );
}