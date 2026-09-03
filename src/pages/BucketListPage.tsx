import { useState } from "react";
import { useBucketItems } from "@/hooks/useBucketItems";
import { useCurrentUser, useUsers } from "@/hooks/useCurrentUser";
import { bucketEngine } from "@/engines/bucket";
import { useProjects } from "@/hooks/useProjects";
import { TaskPriorityBadge } from "@/components/task/TaskPriorityBadge";
import { TaskLabels } from "@/components/task/TaskLabels";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus, Edit, ArrowUpRight } from "lucide-react";
import { PRIORITY_LABELS, type TaskPriority } from "@/engines/task/task.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/shared/utils/time";

export default function BucketListPage() {
  const { user } = useCurrentUser();
  const users = useUsers();
  const items = useBucketItems();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);

  const handlePromote = async (id: string, assignTo: string[]) => {
    try {
      const { task } = await bucketEngine.promote(id, assignTo, user?.id ?? "");
      toast.success("Promoted to task.");
      navigate(`/tasks/${task.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Unable to promote.");
    }
    setPromoting(null);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">Bucket List</h1>
          <p className="text-sm text-muted-foreground">Future work and ideas — not active until promoted.</p>
        </div>
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add to Bucket
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Your bucket is empty.</p>
          <button onClick={() => setAdding(true)} className="mt-3 text-sm text-primary hover:underline">Add a future task</button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((b) => (
            <div key={b.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{b.title}</h3>
                {b.priority && <TaskPriorityBadge priority={b.priority} />}
              </div>
              {b.description && <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>}
              <div className="mt-2"><TaskLabels labels={b.labels} /></div>
              <p className="mt-2 text-xs text-muted-foreground">Created {formatDate(b.createdAt)}</p>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setPromoting(b.id)} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                  <UserPlus className="h-3.5 w-3.5" /> Promote
                </button>
                <button onClick={() => setPromoting(b.id)} className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Assign to me
                </button>
                <button
                  onClick={async () => { if (confirm("Delete this bucket item?")) { await bucketEngine.delete(b.id); toast.success("Deleted."); } }}
                  className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <AddBucketDialog onClose={() => setAdding(false)} userId={user?.id ?? ""} />}
      {promoting && (
        <PromoteDialog
          bucketId={promoting}
          users={users}
          currentUserId={user?.id ?? ""}
          onClose={() => setPromoting(null)}
          onPromote={handlePromote}
        />
      )}
    </div>
  );
}

function AddBucketDialog({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [labels, setLabels] = useState("");
  const [open, setOpen] = useState(true);

  const submit = async () => {
    if (!title.trim()) { toast.error("Title is required."); return; }
    await bucketEngine.create({ title, description, priority, labels: labels.split(",").map((l) => l.trim()).filter(Boolean) }, userId);
    toast.success("Added to bucket.");
    setOpen(false); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add to Bucket</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Labels</Label><Input value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="comma separated" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); onClose(); }}>Cancel</Button>
          <Button onClick={submit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PromoteDialog({ bucketId, users, currentUserId, onClose, onPromote }: { bucketId: string; users: any[]; currentUserId: string; onClose: () => void; onPromote: (id: string, assignTo: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([currentUserId]);
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign & Promote</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Promote this bucket item into a real task assigned to:</p>
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={selected.includes(u.id)} onCheckedChange={(c) => setSelected(c ? [...selected, u.id] : selected.filter((x) => x !== u.id))} />
              {u.fullName}{u.id === currentUserId && " (you)"}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); onClose(); }}>Cancel</Button>
          <Button onClick={() => onPromote(bucketId, selected)}>Promote to task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}