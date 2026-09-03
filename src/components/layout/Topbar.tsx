import { Menu, Search, Sun, Moon, Monitor, UserCheck, Shield, LogOut, Users, Cloud, RefreshCw, CloudUpload } from "lucide-react";
import { useThemeContext } from "@/app/providers";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authEngine } from "@/engines/auth/auth.engine";
import { driveSyncEngine, type SyncState } from "@/engines/sync/driveSync.engine";
import { GoogleDriveSyncModal } from "@/components/sync/GoogleDriveSyncModal";
import type { User as UserType } from "@/engines/user.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, setTheme } = useThemeContext();
  const { currentUser, switchUser, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(driveSyncEngine.getState());
  const [isUploading, setIsUploading] = useState(false);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    authEngine.listUsers().then(setAllUsers).catch(console.error);
    return driveSyncEngine.subscribe((state) => {
      setSyncState(state);
    });
  }, [currentUser]);

  const handleSwitch = async (userId: string, userName: string) => {
    try {
      await switchUser(userId);
      toast.success(`Switched active session to ${userName}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to switch user");
    }
  };

  const handleQuickUpload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUploading(true);
    try {
      await driveSyncEngine.uploadToDrive();
      toast.success("Uploaded current JSON data to Google Drive!");
    } catch (err: any) {
      toast.error(err.message || "Drive upload failed. Please connect Google Drive.");
      setSyncModalOpen(true);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <button className="md:hidden text-muted-foreground" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden md:block text-sm font-medium text-muted-foreground">{today}</div>

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks…"
            className="h-9 w-full rounded-lg border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Google Drive Sync Button */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSyncModalOpen(true)}
            className="h-9 px-2.5 gap-1.5 text-xs border-border/80"
            title="Google Drive JSON Sync"
          >
            {isUploading || syncState.status === "syncing" ? (
              <RefreshCw className="h-4 w-4 animate-spin text-sky-500" />
            ) : (
              <Cloud className={cn("h-4 w-4", syncState.isConnected ? "text-sky-500" : "text-muted-foreground")} />
            )}
            <span className="hidden sm:inline font-medium">Drive Sync</span>
            {syncState.isConnected && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleQuickUpload}
            disabled={isUploading || syncState.status === "syncing"}
            className="h-9 px-2.5 gap-1 text-xs bg-sky-600 hover:bg-sky-700 text-white"
            title="Upload current JSON data to Google Drive"
          >
            {isUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">Sync Now</span>
          </Button>
        </div>

        {/* Theme Switcher */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {([
            ["light", Sun],
            ["dark", Moon],
            ["system", Monitor],
          ] as const).map(([t, Icon]) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                theme === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
              title={t}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* User Account Menu */}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors border">
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.fullName)}`}
                  alt={currentUser.fullName}
                  className="h-7 w-7 rounded-full bg-muted border object-cover"
                />
                <span className="hidden sm:inline text-xs font-semibold max-w-[100px] truncate">{currentUser.fullName}</span>
                <Badge variant="outline" className="hidden lg:inline-flex text-[10px] py-0 uppercase">
                  {currentUser.role}
                </Badge>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{currentUser.fullName}</p>
                  <p className="text-xs text-muted-foreground leading-none">{currentUser.email}</p>
                  <div className="pt-1">
                    <Badge className="text-[10px] uppercase">{currentUser.role} Role</Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Switch Account
              </DropdownMenuLabel>
              {allUsers
                .filter((u) => u.id !== currentUser.id && u.status === "active")
                .map((u) => (
                  <DropdownMenuItem key={u.id} onClick={() => handleSwitch(u.id, u.fullName)} className="gap-2 cursor-pointer text-xs">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{u.fullName}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground capitalize">({u.role})</span>
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSyncModalOpen(true)} className="gap-2 cursor-pointer text-xs">
                <Cloud className="h-3.5 w-3.5 text-sky-500" /> Drive Cloud Backup
              </DropdownMenuItem>
              {(currentUser.role === "admin" || currentUser.role === "manager") && (
                <DropdownMenuItem onClick={() => navigate("/users")} className="gap-2 cursor-pointer text-xs">
                  <Users className="h-3.5 w-3.5" /> User Management
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={async () => {
                  await logout();
                  toast.success("Logged out successfully");
                }}
                className="gap-2 cursor-pointer text-xs text-red-600 focus:text-red-600"
              >
                <LogOut className="h-3.5 w-3.5" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <GoogleDriveSyncModal open={syncModalOpen} onOpenChange={setSyncModalOpen} />
    </>
  );
}