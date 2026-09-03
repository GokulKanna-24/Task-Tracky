import { useState, useEffect } from "react";
import { driveSyncEngine, type SyncState } from "@/engines/sync/driveSync.engine";
import { backupService } from "@/engines/sync/backup.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudUpload, CloudDownload, RefreshCw, Key, CheckCircle2, AlertCircle, LogOut, Download, Upload } from "lucide-react";
import { formatDateTime } from "@/shared/utils/time";
import toast from "react-hot-toast";

interface GoogleDriveSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleDriveSyncModal({ open, onOpenChange }: GoogleDriveSyncModalProps) {
  const [syncState, setSyncState] = useState<SyncState>(driveSyncEngine.getState());
  const [clientIdInput, setClientIdInput] = useState(driveSyncEngine.getClientId());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    return driveSyncEngine.subscribe((state) => {
      setSyncState(state);
    });
  }, []);

  const handleSaveClientId = () => {
    if (!clientIdInput.trim()) {
      toast.error("Please enter a valid Google OAuth Client ID");
      return;
    }
    driveSyncEngine.setClientId(clientIdInput.trim());
    toast.success("Google OAuth Client ID saved");
  };

  const handleConnect = async () => {
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

  const handleDisconnect = () => {
    driveSyncEngine.clearToken();
    toast.success("Disconnected from Google Drive");
  };

  const handleUploadSync = async () => {
    setLoadingAction("upload");
    try {
      await driveSyncEngine.uploadToDrive();
      toast.success("Uploaded current JSON data to Google Drive!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload to Google Drive");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFetchSync = async () => {
    setLoadingAction("fetch");
    try {
      const restored = await driveSyncEngine.fetchAndRestoreFromDrive();
      if (restored) {
        toast.success("Fresh JSON data restored from Google Drive!");
        window.location.reload();
      } else {
        toast.error("No backup file (task-tracky-data.json) found on Google Drive.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch from Google Drive");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportLocalFile = async () => {
    try {
      const json = await backupService.exportBackupJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `task-tracky-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Local JSON backup downloaded");
    } catch (err: any) {
      toast.error("Failed to export backup");
    }
  };

  const handleImportLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await backupService.importBackupJSON(text);
      toast.success("Backup restored successfully! Reloading workspace…");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to import JSON file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Cloud className="h-6 w-6 text-sky-500" /> Google Drive JSON Sync
          </DialogTitle>
          <DialogDescription>
            Store your workspace data as <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">task-tracky-data.json</code> directly in your personal Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Connection Status Box */}
          <div className="p-3.5 rounded-xl border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background border">
                {syncState.isConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  Google Drive Status
                  {syncState.isConnected ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600">Not Connected</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {syncState.lastSyncedAt ? `Last Synced: ${formatDateTime(syncState.lastSyncedAt)}` : "Not synced yet"}
                </div>
              </div>
            </div>

            {syncState.isConnected ? (
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-xs text-red-600 hover:text-red-700">
                <LogOut className="h-3.5 w-3.5 mr-1" /> Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={handleConnect} disabled={loadingAction === "connect"}>
                {loadingAction === "connect" ? "Connecting…" : "Connect"}
              </Button>
            )}
          </div>

          {/* Sync Actions Section */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Cloud Sync Actions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                onClick={handleUploadSync}
                disabled={loadingAction === "upload" || syncState.status === "syncing"}
                className="flex items-center justify-center gap-2 h-auto py-2.5"
              >
                {loadingAction === "upload" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CloudUpload className="h-4 w-4" />
                )}
                <div className="text-left">
                  <div className="font-semibold text-xs">Upload to Drive</div>
                  <div className="text-[10px] opacity-80">Overwrite Drive JSON</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={handleFetchSync}
                disabled={loadingAction === "fetch" || syncState.status === "syncing" || !syncState.isConnected}
                className="flex items-center justify-center gap-2 h-auto py-2.5"
              >
                {loadingAction === "fetch" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CloudDownload className="h-4 w-4 text-sky-500" />
                )}
                <div className="text-left">
                  <div className="font-semibold text-xs">Fetch Fresh JSON</div>
                  <div className="text-[10px] text-muted-foreground">Download & Restore</div>
                </div>
              </Button>
            </div>
          </div>

          {/* OAuth Client ID Configuration */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientId" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Key className="h-3.5 w-3.5" /> Google OAuth Client ID
              </Label>
              <span className="text-[10px] text-muted-foreground">Required for custom Drive access</span>
            </div>
            <div className="flex gap-2">
              <Input
                id="clientId"
                placeholder="123456789-abc.apps.googleusercontent.com"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                className="text-xs font-mono"
              />
              <Button variant="secondary" size="sm" onClick={handleSaveClientId}>
                Save
              </Button>
            </div>
          </div>

          {/* Local File Fallback */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Manual File Backup</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportLocalFile} className="flex-1 text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export JSON
              </Button>
              <label className="flex-1">
                <Input type="file" accept=".json" onChange={handleImportLocalFile} className="hidden" />
                <Button variant="outline" size="sm" asChild className="w-full text-xs gap-1.5 cursor-pointer">
                  <span>
                    <Upload className="h-3.5 w-3.5" /> Import JSON
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
