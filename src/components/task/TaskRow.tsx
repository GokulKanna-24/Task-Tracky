import { useNavigate } from "react-router-dom";
import { ChevronRight, History, MessageSquare } from "lucide-react";
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
import { useProjects } from "@/hooks/useProjects";
import type { Task } from "@/engines/task/task.types";

export function TaskRow({ task, userId }: { task: Task; userId: string | null | undefined }) {
  const navigate = useNavigate();
  const projects = useProjects();
  const { totalSeconds, active } = useTaskTotalTime(task.id);
  const timeline = useTaskTimeline(task.id);
  const comments = useComments(task.id);
  const project = projects.find((p) => p.id === task.projectId);

  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40 cursor-pointer"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          <h3 className="truncate text-sm font-medium">{task.title}</h3>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {project && <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: project.color }} />{project.name}</span>}
          <TaskLabels labels={task.labels} />
          <TaskDueDate dueDate={task.dueDate} />
        </div>
      </div>
      <div className="hidden sm:block"><TaskStatusBadge status={task.status} /></div>
      <div className="hidden md:block"><TaskAssignees userIds={task.assignedUserIds} /></div>
      <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><History className="h-3 w-3" />{timeline.length}</span>
        <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{comments.length}</span>
      </div>
      <div className="hidden sm:block"><TaskTimeSummary totalSeconds={totalSeconds} active={active} /></div>
      <div onClick={(e) => e.stopPropagation()}><TaskTimer taskId={task.id} userId={userId} compact /></div>
      <div onClick={(e) => e.stopPropagation()}><TaskActions task={task} userId={userId} /></div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}