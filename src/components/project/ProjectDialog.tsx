import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { projectEngine } from "@/engines/project";
import type { Project } from "@/engines/project/project.types";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

export function ProjectDialog({ project, ownerId, onClose }: { project?: Project; ownerId: string; onClose: () => void }) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? COLORS[0]);
  const [open, setOpen] = useState(true);

  const submit = async () => {
    if (!name.trim()) { toast.error("Name is required."); return; }
    try {
      if (project) await projectEngine.update(project.id, { name, description, color });
      else await projectEngine.create(name, ownerId, description, color);
      toast.success(project ? "Project updated." : "Project created.");
      setOpen(false); onClose();
    } catch (e: any) { toast.error(e.message ?? "Unable to save."); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div>
            <Label>Color</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className="h-8 w-8 rounded-full border-2 transition-transform" style={{ background: c, borderColor: color === c ? "var(--foreground)" : "transparent" }} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); onClose(); }}>Cancel</Button>
          <Button onClick={submit}>{project ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}