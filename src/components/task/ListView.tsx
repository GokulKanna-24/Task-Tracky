import { TaskRow } from "./TaskRow";
import { useTasks, type TaskFilters } from "@/hooks/useTasks";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function ListView({ filters }: { filters?: TaskFilters }) {
  const { user } = useCurrentUser();
  const tasks = useTasks(filters);
  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">No tasks yet.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => <TaskRow key={t.id} task={t} userId={user?.id} />)}
    </div>
  );
}