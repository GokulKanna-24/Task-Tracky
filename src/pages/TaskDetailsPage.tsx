import { useParams, useNavigate } from "react-router-dom";
import { useTask, useTaskTotalTime } from "@/hooks/useTasks";
import { useTaskTimeline } from "@/hooks/useTaskTimeline";
import { useComments } from "@/hooks/useComments";
import { useScheduleByTask } from "@/hooks/useScheduleEvents";
import { useProjects, useProject } from "@/hooks/useProjects";
import { useUsers, useCurrentUser } from "@/hooks/useCurrentUser";
import { TaskStatusBadge, TaskPriorityBadge, TaskLabels, TaskAssignees, TaskDueDate, TaskTimer, TaskFormDialog } from "@/components/task";
import { commentEngine } from "@/engines/comments";
import { sharingEngine } from "@/engines/sharing";
import { taskEngine } from "@/engines/task";
import { taskSchedulingService } from "@/engines/orchestration";
import { formatDate, formatDateTime, formatDuration } from "@/shared/utils/time";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Share2, Edit, Plus, Clock, History, MessageSquare, Pin, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/engines/task/task.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function TaskDetailsPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const users = useUsers();
  const task = useTask(taskId);
  const { totalSeconds, active } = useTaskTotalTime(taskId);
  const timeline = useTaskTimeline(taskId);
  const comments = useComments(taskId);
  const schedule = useScheduleByTask(taskId);
  const project = useProject(task?.projectId ?? undefined);
  const [editing, setEditing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentVis, setCommentVis] = useState<"private" | "public">("private");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");

  if (!task) {
    return <div className="p-8 text-center text-muted-foreground">Task could not be found. <button className="text-primary underline" onClick={() => navigate("/tasks")}>Back</button></div>;
  }

  const plannedSeconds = schedule.reduce((s, e) => s + Math.floor((e.endAt - e.startAt) / 1000), 0);
  const variance = totalSeconds - plannedSeconds;

  const addComment = async () => {
    if (!newComment.trim()) return;
    await commentEngine.add(task.id, user?.id ?? "", newComment.trim(), commentVis);
    setNewComment("");
    toast.success("Comment added.");
  };

  const handleShare = async () => {
    const link = await sharingEngine.create(task.id, user?.id ?? "", 30);
    const url = `${window.location.origin}/share/task/${link.token}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Share link copied.", { description: "Valid for 30 days." });
  };

  const sortedTimeline = [...timeline].sort((a, b) => order === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
          {project && <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs"><span className="h-2 w-2 rounded-full" style={{ background: project.color }} />{project.name}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit className="h-4 w-4" /> Edit</Button>
          <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="h-4 w-4" /> Share</Button>
        </div>
      </div>

      <h1 className="text-2xl font-display font-semibold tracking-tight">{task.title}</h1>
      {task.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border bg-card p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Assignees</p><div className="mt-1"><TaskAssignees userIds={task.assignedUserIds} /></div></div>
              <div><p className="text-xs text-muted-foreground">Due date</p><div className="mt-1"><TaskDueDate dueDate={task.dueDate} /></div></div>
              <div><p className="text-xs text-muted-foreground">Created</p><p className="mt-1">{formatDate(task.createdAt)}</p></div>
              <div><p className="text-xs text-muted-foreground">Assigned</p><p className="mt-1">{task.assignedAt ? formatDate(task.assignedAt) : "—"}</p></div>
              <div className="col-span-2"><p className="text-xs text-muted-foreground">Labels</p><div className="mt-1"><TaskLabels labels={task.labels} /></div></div>
            </div>
            <div className="mt-4">
              <TaskTimer taskId={task.id} userId={user?.id} />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold mb-3">Schedule</h2>
            {schedule.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No schedule planned</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setScheduling(true)}><Calendar className="h-4 w-4" /> Schedule Task</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {schedule.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    {e.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{formatDateTime(e.startAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(e.endAt)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDuration(Math.floor((e.endAt - e.startAt) / 1000))}</span>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="mt-1" onClick={() => setScheduling(true)}><Plus className="h-4 w-4" /> Add session</Button>
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/40 p-2"><p className="text-xs text-muted-foreground">Planned</p><p className="text-sm font-semibold">{formatDuration(plannedSeconds)}</p></div>
              <div className="rounded-lg bg-muted/40 p-2"><p className="text-xs text-muted-foreground">Actual</p><p className="text-sm font-semibold">{formatDuration(totalSeconds)}</p></div>
              <div className="rounded-lg bg-muted/40 p-2"><p className="text-xs text-muted-foreground">Variance</p><p className={cn("text-sm font-semibold", variance < 0 ? "text-red-500" : "text-emerald-500")}>{variance < 0 ? "-" : "+"}{formatDuration(Math.abs(variance))}</p></div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold inline-flex items-center gap-2"><History className="h-4 w-4" /> Timeline</h2>
              <button onClick={() => setOrder(order === "newest" ? "oldest" : "newest")} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                {order === "newest" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} {order}
              </button>
            </div>
            {sortedTimeline.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p> : (
              <ol className="relative space-y-3 border-l pl-4 ml-1">
                {sortedTimeline.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-xs text-muted-foreground">{new Date(ev.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-sm">{ev.message}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold mb-3 inline-flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments</h2>
            <div className="space-y-2 mb-3">
              {comments.length === 0 ? <p className="text-sm text-muted-foreground py-2 text-center">No comments yet.</p> : comments.map((c) => {
                const author = users.find((u) => u.id === c.userId);
                return (
                  <div key={c.id} className="rounded-lg border px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{author?.fullName ?? "Unknown"}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px]", c.visibility === "public" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>{c.visibility}</span>
                    </div>
                    <p className="mt-1 text-sm">{c.body}</p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <Textarea rows={2} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment…" />
              <div className="flex items-center justify-between">
                <Select value={commentVis} onValueChange={(v) => setCommentVis(v as "private" | "public")}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addComment}>Add comment</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold mb-3">Quick status</h2>
            <Select value={task.status} onValueChange={async (v) => { await taskEngine.changeStatus(task.id, v as TaskStatus, user?.id ?? ""); toast.success("Status updated."); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Tracked</span><span className="font-medium">{formatDuration(totalSeconds)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Planned</span><span className="font-medium">{formatDuration(plannedSeconds)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Timeline events</span><span className="font-medium">{timeline.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Comments</span><span className="font-medium">{comments.length}</span></div>
          </div>
        </div>
      </div>

      {editing && <TaskFormDialog task={task} onClose={() => setEditing(false)} />}
      {scheduling && <ScheduleDialog taskId={task.id} userId={user?.id ?? ""} onClose={() => setScheduling(false)} />}
    </div>
  );
}

function ScheduleDialog({ taskId, userId, onClose }: { taskId: string; userId: string; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [pinned, setPinned] = useState(false);
  const [open, setOpen] = useState(true);

  const submit = async () => {
    const startAt = new Date(`${date}T${start}`).getTime();
    const endAt = new Date(`${date}T${end}`).getTime();
    if (endAt <= startAt) { toast.error("End must be after start."); return; }
    try {
      const { conflicts } = await taskSchedulingService.scheduleExistingTask(taskId, startAt, endAt, userId, pinned);
      if (conflicts.length) toast.warning("Schedule created with conflicts.", { description: `${conflicts.length} overlapping event(s).` });
      else toast.success("Task scheduled.");
      setOpen(false); onClose();
    } catch (e: any) { toast.error(e.message ?? "Could not create schedule."); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><Label>End</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin this session</label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); onClose(); }}>Cancel</Button>
          <Button onClick={submit}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}