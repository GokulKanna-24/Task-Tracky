import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Pause, Square, Calendar, Share2, Trash2, Edit, ArrowRight } from "lucide-react";
import { useTaskTimer } from "@/hooks/useTaskTimer";
import { taskEngine } from "@/engines/task";
import { sharingEngine } from "@/engines/sharing";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { TaskFormDialog } from "./TaskFormDialog";

export function TaskActions({ task, userId, onEdit }: { task: import("@/engines/task/task.types").Task; userId: string | null | undefined; onEdit?: () => void }) {
  const navigate = useNavigate();
  const { start, pause, stop, isRunningOnThis } = useTaskTimer(task.id, userId);
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    await taskEngine.delete(task.id);
    toast.success("Task deleted.");
    navigate("/tasks");
  };

  const handleShare = async () => {
    const link = await sharingEngine.create(task.id, userId ?? "");
    const url = `${window.location.origin}/share/task/${link.token}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Share link copied to clipboard.", { description: url });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => navigate(`/tasks/${task.id}`)}>
            <ArrowRight className="h-4 w-4" /> Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isRunningOnThis && (
            <DropdownMenuItem onClick={start}>
              <Play className="h-4 w-4" /> Start timer
            </DropdownMenuItem>
          )}
          {isRunningOnThis && (
            <DropdownMenuItem onClick={pause}>
              <Pause className="h-4 w-4" /> Pause timer
            </DropdownMenuItem>
          )}
          {isRunningOnThis && (
            <DropdownMenuItem onClick={stop}>
              <Square className="h-4 w-4" /> Stop timer
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/scheduler`)}>
            <Calendar className="h-4 w-4" /> Schedule
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editing && <TaskFormDialog task={task} onClose={() => setEditing(false)} />}
    </>
  );
}