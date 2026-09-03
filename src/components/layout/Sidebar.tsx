import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { LayoutDashboard, CheckSquare, Inbox, Calendar, Folder, Settings, Users, LogOut, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { currentUser, logout } = useAuth();
  const { isManager } = usePermissions();

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tasks", label: "Tasks", icon: CheckSquare },
    { to: "/bucket", label: "Bucket List", icon: Inbox },
    { to: "/scheduler", label: "Scheduler", icon: Calendar },
    { to: "/projects", label: "Projects", icon: Folder },
    ...(isManager ? [{ to: "/users", label: "User Management", icon: Users }] : []),
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "z-40 flex h-full w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0",
          mobileOpen ? "fixed translate-x-0" : "fixed -translate-x-full md:static md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold text-sm">TT</div>
            <span className="font-display text-lg font-semibold tracking-tight">Task-Tracky</span>
          </div>
          <button className="md:hidden text-muted-foreground" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {currentUser && (
          <div className="border-t p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 border">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.fullName)}`}
                  alt={currentUser.fullName}
                  className="h-8 w-8 rounded-full bg-muted border shrink-0 object-cover"
                />
                <div className="truncate text-left">
                  <div className="text-xs font-semibold truncate leading-tight">{currentUser.fullName}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">{currentUser.role}</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  toast.success("Logged out successfully");
                }}
                title="Sign out"
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground font-medium">Local-first · IndexedDB</p>
          </div>
        )}
      </aside>
    </>
  );
}