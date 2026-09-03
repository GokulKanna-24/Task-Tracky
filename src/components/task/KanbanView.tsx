import { useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import { TaskFormDialog } from "./TaskFormDialog";
import { Plus } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { taskEngine, TASK_STATUSES, STATUS_LABELS, type Task, type TaskStatus } from "@/engines/task";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const columnAccents: Record<TaskStatus, string> = {
  backlog: "border-t-slate-400",
  todo: "border-t-blue-500",
  in_progress: "border-t-amber-500",
  review: "border-t-purple-500",
  completed: "border-t-emerald-500",
};

function Column({ status, tasks, userId, onAdd }: { status: TaskStatus; tasks: Task[]; userId: string | null | undefined; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className={cn("flex items-center justify-between rounded-t-lg border border-b-0 bg-muted/50 px-3 py-2 border-t-4", columnAccents[status])}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{tasks.length}</span>
        </div>
        <button onClick={onAdd} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><Plus className="h-4 w-4" /></button>
      </div>
      <div
        ref={setNodeRef}
        className={cn("flex flex-1 flex-col gap-2 overflow-y-auto rounded-b-lg border bg-muted/20 p-2 min-h-[200px]", isOver && "bg-primary/5 ring-2 ring-primary/30")}
      >
        {tasks.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted-foreground">No tasks</p>}
        {tasks.map((t) => <DraggableCard key={t.id} task={t} userId={userId} />)}
      </div>
    </div>
  );
}

function DraggableCard({ task, userId }: { task: Task; userId: string | null | undefined }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn(isDragging && "opacity-40")}>
      <TaskCard task={task} userId={userId} />
    </div>
  );
}

export function KanbanView() {
  const { user } = useCurrentUser();
  const tasks = useTasks();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s);
  const activeTask = tasks.find((t) => t.id === activeId);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id as TaskStatus | undefined;
    const taskId = String(e.active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !overId) return;
    if (task.status === overId) return;
    try {
      await taskEngine.changeStatus(task.id, overId, user?.id ?? "");
      toast.success(`Moved to ${STATUS_LABELS[overId]}`);
    } catch {
      toast.error("Unable to move task.");
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {TASK_STATUSES.map((s) => (
            <Column key={s} status={s} tasks={byStatus(s)} userId={user?.id} onAdd={() => setAdding(true)} />
          ))}
        </div>
        <DragOverlay>{activeTask ? <TaskCard task={activeTask} userId={user?.id} /> : null}</DragOverlay>
      </DndContext>
      {adding && <TaskFormDialog onClose={() => setAdding(false)} />}
    </div>
  );
}