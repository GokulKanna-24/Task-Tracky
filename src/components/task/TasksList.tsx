import { useState } from "react";
import { ListView } from "./ListView";
import { TaskFormDialog } from "./TaskFormDialog";
import { Plus } from "lucide-react";

export function TasksList() {
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>
      <ListView />
      {adding && <TaskFormDialog onClose={() => setAdding(false)} />}
    </div>
  );
}