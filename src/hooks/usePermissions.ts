import { useAuth } from "@/context/AuthContext";
import type { Permission } from "@/engines/auth/rbac";

export function usePermissions() {
  const { currentUser, hasPermission, canManageUsers, canDeleteTask } = useAuth();

  return {
    currentUser,
    role: currentUser?.role,
    isAdmin: currentUser?.role === "admin",
    isManager: currentUser?.role === "manager" || currentUser?.role === "admin",
    hasPermission: (permission: Permission) => hasPermission(permission),
    canManageUsers,
    canDeleteTask,
    canCreateProject: hasPermission("projects:create"),
    canDeleteProject: hasPermission("projects:delete"),
    canManageSettings: hasPermission("settings:manage"),
    canExportData: hasPermission("data:export"),
  };
}
