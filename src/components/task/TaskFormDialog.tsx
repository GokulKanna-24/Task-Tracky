import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { taskEngine, TASK_STATUSES, TASK_PRIORITIES, STATUS_LABELS, PRIORITY_LABELS, type Task, type TaskStatus, type TaskPriority } from "@/engines/task";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useCurrentUser";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  status: z.enum(["backlog", "todo", "in_progress", "review", "completed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  projectId: z.string().nullable(),
  labels: z.string().optional(),
  dueDate: z.string().optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

export function TaskFormDialog({ task, onClose }: { task?: Task; onClose?: () => void }) {
  const projects = useProjects();
  const users = useUsers();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(true);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      projectId: task?.projectId ?? null,
      labels: task?.labels?.join(", ") ?? "",
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      assignedUserIds: task?.assignedUserIds ?? [],
    },
  });

  const onSubmit = async (values: FormValues) => {
    const labels = (values.labels ?? "").split(",").map((l) => l.trim()).filter(Boolean);
    const dueDate = values.dueDate ? new Date(values.dueDate).getTime() : null;
    const assignedUserIds = values.assignedUserIds ?? [];
    try {
      if (task) {
        await taskEngine.update(
          task.id,
          {
            title: values.title,
            description: values.description ?? "",
            status: values.status as TaskStatus,
            priority: values.priority as TaskPriority,
            projectId: values.projectId,
            labels,
            dueDate,
            assignedUserIds,
          },
          user?.id ?? "",
        );
        toast.success("Task updated.");
      } else {
        await taskEngine.create(
          {
            title: values.title,
            description: values.description ?? "",
            status: values.status as TaskStatus,
            priority: values.priority as TaskPriority,
            projectId: values.projectId,
            labels,
            dueDate,
            assignedUserIds,
          },
          user?.id ?? "",
        );
        toast.success("Task created.");
      }
      setOpen(false);
      onClose?.();
    } catch (e) {
      toast.error("Unable to save task.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose?.(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as FormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as FormValues["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={form.watch("projectId") ?? "none"} onValueChange={(v) => form.setValue("projectId", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...form.register("dueDate")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="labels">Labels (comma separated)</Label>
            <Input id="labels" placeholder="frontend, urgent" {...form.register("labels")} />
          </div>
          <div className="space-y-1.5">
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-3 rounded-lg border p-3 max-h-32 overflow-y-auto">
              {users.map((u) => {
                const checked = (form.watch("assignedUserIds") ?? []).includes(u.id);
                return (
                  <label key={u.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        const cur = form.getValues("assignedUserIds") ?? [];
                        form.setValue("assignedUserIds", c ? [...cur, u.id] : cur.filter((x) => x !== u.id));
                      }}
                    />
                    {u.fullName}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); onClose?.(); }}>Cancel</Button>
            <Button type="submit">{task ? "Save changes" : "Create task"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}