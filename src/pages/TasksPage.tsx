import { useState } from "react";
import { KanbanView } from "@/components/task/KanbanView";
import { TasksList } from "@/components/task/TasksList";
import { ListView } from "@/components/task/ListView";
import { useSearchParams } from "react-router-dom";
import { Trello, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface TasksPageProps {
  defaultTab?: "kanban" | "list";
}

export default function TasksPage({ defaultTab }: TasksPageProps) {
  const [params, setParams] = useSearchParams();
  const currentViewParam = params.get("view");
  const view = currentViewParam ? (currentViewParam === "list" ? "list" : "kanban") : (defaultTab ?? "kanban");
  const setView = (v: "kanban" | "list") => setParams({ view: v });

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage all your work in one place.</p>
        </div>
        <div className="inline-flex rounded-lg border p-1">
          <button onClick={() => setView("kanban")} className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium", view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <Trello className="h-4 w-4" /> Kanban
          </button>
          <button onClick={() => setView("list")} className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <List className="h-4 w-4" /> List
          </button>
        </div>
      </div>
      {view === "kanban" ? <KanbanView /> : <TasksList />}
    </div>
  );
}