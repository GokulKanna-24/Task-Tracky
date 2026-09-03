import { useState, useEffect, useRef } from "react";
import { useSettings, useTheme } from "@/hooks/useSettings";
import { storageService } from "@/database/storage.service";
import { db } from "@/database/db";
import { driveSyncEngine, type SyncState } from "@/engines/sync/driveSync.engine";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Trash2, HardDrive, ShieldAlert, Cloud, CloudUpload, CloudDownload, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDateTime } from "@/shared/utils/time";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const { theme, setTheme } = useTheme();
  const [estimate, setEstimate] = useState<{ usage: number; quota: number; percent: number } | null>(null);
  const [syncState, setSyncState] = useState<SyncState>(driveSyncEngine.getState());
  const [clientIdInput, setClientIdInput] = useState(driveSyncEngine.getClientId());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storageService.getStorageEstimate().then(setEstimate);
    return driveSyncEngine.subscribe((state) => {
      setSyncState(state);
    });
  }, []);

  if (!settings) return <div className="p-8 text-center text-muted-foreground">Loading settings…</div>;

  const handleSaveClientId = () => {
    if (!clientIdInput.trim()) {
      toast.error("Please enter a valid Google Client ID");
      return;
    }
    driveSyncEngine.setClientId(clientIdInput.trim());
    toast.success("Google Client ID saved");
  };

  const handleConnectDrive = async () => {
    setLoadingAction("connect");
    try {
      await driveSyncEngine.authorizeWithOAuth();
      toast.success("Connected to Google Drive!");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to Google Drive");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisconnectDrive = () => {
    driveSyncEngine.clearToken();
    toast.success("Disconnected from Google Drive");
  };

  const handleUploadToDrive = async () => {
    setLoadingAction("upload");
    try {
      await driveSyncEngine.uploadToDrive();
      toast.success("Uploaded current JSON payload to Google Drive!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload to Google Drive");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFetchFromDrive = async () => {
    setLoadingAction("fetch");
    try {
      const restored = await driveSyncEngine.fetchAndRestoreFromDrive();
      if (restored) {
        toast.success("Fresh JSON payload downloaded & restored from Google Drive!");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("No task-tracky-data.json found on Google Drive.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch from Google Drive");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExport = async () => {
    const json = await storageService.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasktracky-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported.");
  };

  const handleImport = async (file: File, mode: "merge" | "replace") => {
    try {
      const text = await file.text();
      const { counts } = await storageService.importJSON(text, mode);
      toast.success(`Imported (${mode}). Counts: ` + Object.entries(counts).filter(([, n]) => n).map(([k, n]) => `${k}: ${n}`).join(", "));
      setTimeout(() => window.location.reload(), 1200);
    } catch (e: any) {
      toast.error(e.message ?? "Import failed.");
    }
  };

  const clearAll = async () => {
    if (!confirm("Erase ALL local data? This cannot be undone.")) return;
    await db.delete();
    toast.success("All data erased. Reloading…");
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure Task-Tracky to your workflow.</p>
      </div>

      {/* Google Drive Cloud Sync Card */}
      <Card className="p-5 space-y-4 border-sky-200 dark:border-sky-900/50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-lg">
            <Cloud className="h-5 w-5 text-sky-500" /> Google Drive Cloud Sync
          </h2>
          {syncState.isConnected ? (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300">Connected</Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600">Not Connected</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Synchronize your workspace state as <code className="bg-muted px-1.5 py-0.5 rounded font-mono">task-tracky-data.json</code> across devices using your personal Google Drive.
        </p>

        <div className="p-3 rounded-lg border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-medium text-foreground">Cloud Status</div>
            <div className="text-muted-foreground">
              {syncState.lastSyncedAt ? `Last Synced: ${formatDateTime(syncState.lastSyncedAt)}` : "Never synced"}
            </div>
          </div>
          {syncState.isConnected ? (
            <Button variant="ghost" size="sm" onClick={handleDisconnectDrive} className="text-red-600 text-xs h-8">
              Disconnect Account
            </Button>
          ) : (
            <Button size="sm" onClick={handleConnectDrive} disabled={loadingAction === "connect"} className="h-8">
              {loadingAction === "connect" ? "Connecting…" : "Connect Google Drive"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Button
            onClick={handleUploadToDrive}
            disabled={loadingAction === "upload" || syncState.status === "syncing"}
            className="flex items-center justify-center gap-2"
          >
            <CloudUpload className="h-4 w-4" /> Upload / Overwrite Drive JSON
          </Button>

          <Button
            variant="outline"
            onClick={handleFetchFromDrive}
            disabled={loadingAction === "fetch" || !syncState.isConnected}
            className="flex items-center justify-center gap-2"
          >
            <CloudDownload className="h-4 w-4 text-sky-500" /> Fetch Fresh JSON from Drive
          </Button>
        </div>

        <div className="space-y-2 pt-3 border-t">
          <Label htmlFor="driveClientId" className="text-xs font-semibold flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5" /> Google OAuth Client ID
          </Label>
          <div className="flex gap-2">
            <Input
              id="driveClientId"
              placeholder="Your Google OAuth Client ID"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              className="text-xs font-mono"
            />
            <Button variant="secondary" size="sm" onClick={handleSaveClientId}>
              Save Client ID
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Appearance</h2>
        <div>
          <Label>Theme</Label>
          <Select value={theme} onValueChange={(v) => { setTheme(v as any); update({ theme: v as any }); }}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Week starts on</Label>
          <Select value={String(settings.weekStartsOn)} onValueChange={(v) => update({ weekStartsOn: Number(v) })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Scheduling</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Working day start</Label>
            <Input type="number" min={0} max={23} value={settings.workingDayStart} onChange={(e) => update({ workingDayStart: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Working day end</Label>
            <Input type="number" min={0} max={23} value={settings.workingDayEnd} onChange={(e) => update({ workingDayEnd: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <Label>Default event duration (minutes)</Label>
          <Input type="number" min={5} value={settings.defaultEventDurationMinutes} onChange={(e) => update({ defaultEventDurationMinutes: Number(e.target.value) })} />
        </div>
        <div className="flex items-center justify-between">
          <Label>Show weekends</Label>
          <Switch checked={settings.showWeekends} onCheckedChange={(c) => update({ showWeekends: c })} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Workload & Display</h2>
        <div className="flex items-center justify-between"><Label>Show workload indicators</Label><Switch checked={settings.showWorkload} onCheckedChange={(c) => update({ showWorkload: c })} /></div>
        <div className="flex items-center justify-between"><Label>Show completed tasks</Label><Switch checked={settings.showCompletedTasks} onCheckedChange={(c) => update({ showCompletedTasks: c })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Moderate (h)</Label><Input type="number" step={0.5} value={settings.workloadThresholds.moderate} onChange={(e) => update({ workloadThresholds: { ...settings.workloadThresholds, moderate: Number(e.target.value) } })} /></div>
          <div><Label>Heavy (h)</Label><Input type="number" step={0.5} value={settings.workloadThresholds.heavy} onChange={(e) => update({ workloadThresholds: { ...settings.workloadThresholds, heavy: Number(e.target.value) } })} /></div>
          <div><Label>Overloaded (h)</Label><Input type="number" step={0.5} value={settings.workloadThresholds.overloaded} onChange={(e) => update({ workloadThresholds: { ...settings.workloadThresholds, overloaded: Number(e.target.value) } })} /></div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><HardDrive className="h-4 w-4" /> Data & Local Backup</h2>
        {estimate && (
          <div className="text-sm text-muted-foreground">
            Storage used: <span className="font-medium text-foreground">{(estimate.usage / 1024 / 1024).toFixed(2)} MB</span> ({estimate.percent}% of quota)
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> Export JSON</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import JSON (merge)</Button>
          <Button variant="outline" onClick={() => { if (fileRef.current) { fileRef.current.dataset.mode = "replace"; fileRef.current.click(); } }}><Upload className="h-4 w-4" /> Import JSON (replace)</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const mode = (e.target.dataset.mode as "merge" | "replace") || "merge";
              handleImport(f, mode);
              e.target.value = "";
              e.target.dataset.mode = "";
            }}
          />
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <h3 className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400"><ShieldAlert className="h-4 w-4" /> Danger zone</h3>
          <p className="mt-1 text-xs text-muted-foreground">Erases all tasks, time, schedules, and settings from this device.</p>
          <Button variant="destructive" className="mt-2" onClick={clearAll}><Trash2 className="h-4 w-4" /> Erase all data</Button>
        </div>
      </Card>
    </div>
  );
}