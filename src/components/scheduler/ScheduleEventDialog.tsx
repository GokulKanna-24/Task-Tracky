import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useTasks } from "@/hooks/useTasks";
import { schedulerEngine } from "@/engines/scheduler";
import { toast } from "sonner";

export function ScheduleEventDialog({
  initialDate,
  initialStart,
  initialEnd,
  userId,
  onClose,
}: {
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
  userId: string;
  onClose: () => void;
}) {
  const tasks = useTasks();
  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState(initialStart ?? "09:00");
  const [end, setEnd] = useState(initialEnd ?? "10:00");
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [pinned, setPinned] = useState(false);
  const [open, setOpen] = useState(true);

  const submit = async () => {
    const startAt = new Date(`${date}T${start}`).getTime();
    const endAt = new Date(`${date}T${end}`).getTime();
    if (endAt <= startAt) { toast.error("End must be after start."); return; }
    if (!taskId) { toast.error("Select a task."); return; }
    const task = tasks.find((t) => t.id === taskId);
    try {
      const conflicts = await schedulerEngine.detectConflicts(userId, startAt, endAt);
      await schedulerEngine.create({ taskId, userId, title: task?.title ?? "Task", startAt, endAt, isPinned: pinned }, userId);
      if (conflicts.length) toast.warning("Scheduled with conflicts.", { description: `${conflicts.length} overlap(s).` });
      else toast.success("Event scheduled.");
      setOpen(false); onClose();
    } catch (e: any) { toast.error(e.message ?? "Could not schedule."); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule a task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Task</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
              <SelectContent>
                {tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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