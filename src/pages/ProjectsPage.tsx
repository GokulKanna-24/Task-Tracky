import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects, useProjectTasks } from "@/hooks/useProjects";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { projectEngine } from "@/engines/project";
import { ProjectDialog } from "@/components/project/ProjectDialog";
import { ListView } from "@/components/task/ListView";
import { Plus, Edit, Trash2, FolderKanban, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/shared/utils/time";

export default function ProjectsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const projects = useProjects();
  const tasks = useProjectTasks(projectId);
  const [editing, setEditing] = useState<typeof projects[number] | null>(null);
  const [creating, setCreating] = useState(false);

  if (projectId) {
    const project = projects.find((p) => p.id === projectId);
    const completed = tasks.filter((t) => t.status === "completed").length;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-4">
        <button onClick={() => navigate("/projects")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All projects</button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: project?.color }} />
            <h1 className="text-2xl font-display font-semibold tracking-tight">{project?.name ?? "Project"}</h1>
          </div>
          <button onClick={() => setEditing(project ?? null)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><Edit className="h-4 w-4" /> Edit</button>
        </div>
        {project?.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{tasks.length} tasks</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{completed} completed</span>
          <div className="ml-auto h-2 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs tabular-nums">{progress}%</span>
        </div>
        <ListView filters={{ projectId }} />
        {editing && <ProjectDialog project={editing} ownerId={user?.id ?? ""} onClose={() => setEditing(null)} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Organize tasks into projects.</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> New project</button>
      </div>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <FolderKanban className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No projects yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => {
            return (
              <div key={p.id} className="group rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <button onClick={() => navigate(`/projects/${p.id}`)} className="flex items-center gap-2 text-left">
                    <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                    <h3 className="font-semibold hover:underline">{p.name}</h3>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(p)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Edit className="h-4 w-4" /></button>
                    <button onClick={async () => { if (confirm(`Delete "${p.name}"? Its tasks will be unassigned.`)) { await projectEngine.delete(p.id); toast.success("Project deleted."); } }} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {p.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <p className="mt-2 text-xs text-muted-foreground">Created {formatDate(p.createdAt)}</p>
                <button onClick={() => navigate(`/projects/${p.id}`)} className="mt-2 text-xs text-primary hover:underline">View tasks →</button>
              </div>
            );
          })}
        </div>
      )}
      {creating && <ProjectDialog ownerId={user?.id ?? ""} onClose={() => setCreating(false)} />}
      {editing && <ProjectDialog project={editing} ownerId={user?.id ?? ""} onClose={() => setEditing(null)} />}
    </div>
  );
}