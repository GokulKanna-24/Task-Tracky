import { useNavigate } from "react-router-dom";
import { MessageSquare, History, Clock } from "lucide-react";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskLabels } from "./TaskLabels";
import { TaskAssignees } from "./TaskAssignees";
import { TaskDueDate } from "./TaskDueDate";
import { TaskTimeSummary } from "./TaskTimeSummary";
import { TaskTimer } from "./TaskTimer";
import { TaskActions } from "./TaskActions";
import { useTaskTotalTime, useTaskTimeEntries } from "@/hooks/useTasks";
import { useTaskTimeline } from "@/hooks/useTaskTimeline";
import { useComments } from "@/hooks/useComments";
import type { Task } from "@/engines/task/task.types";

export function TaskCard({ task, userId }: { task: Task; userId: string | null | undefined }) {
  const navigate = useNavigate();
  const { totalSeconds, active } = useTaskTotalTime(task.id);
  const timeline = useTaskTimeline(task.id);
  const comments = useComments(task.id);

  return (
    <div
      className="group rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/40 cursor-pointer"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <TaskPriorityBadge priority={task.priority} />
        <div onClick={(e) => e.stopPropagation()}>
          <TaskActions task={task} userId={userId} />
        </div>
      </div>
      <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug">{task.title}</h3>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}
      <div className="mt-2"><TaskLabels labels={task.labels} /></div>
      <div className="mt-2.5 flex items-center justify-between">
        <TaskAssignees userIds={task.assignedUserIds} />
        <TaskDueDate dueDate={task.dueDate} />
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t pt-2">
        <TaskTimeSummary totalSeconds={totalSeconds} active={active} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><History className="h-3 w-3" /> {timeline.length}</span>
          <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {comments.length}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <TaskStatusBadge status={task.status} />
        <TaskTimer taskId={task.id} userId={userId} compact />
      </div>
    </div>
  );
}