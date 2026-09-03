import type { User, UserRole } from "@/engines/user.types";

export type Permission =
  | "users:read"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "settings:manage"
  | "projects:create"
  | "projects:edit"
  | "projects:delete"
  | "tasks:create"
  | "tasks:edit"
  | "tasks:delete"
  | "time:track"
  | "bucket:manage"
  | "data:export"
  | "data:import";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "users:read",
    "users:create",
    "users:edit",
    "users:delete",
    "settings:manage",
    "projects:create",
    "projects:edit",
    "projects:delete",
    "tasks:create",
    "tasks:edit",
    "tasks:delete",
    "time:track",
    "bucket:manage",
    "data:export",
    "data:import",
  ],
  manager: [
    "users:read",
    "projects:create",
    "projects:edit",
    "tasks:create",
    "tasks:edit",
    "tasks:delete",
    "time:track",
    "bucket:manage",
    "data:export",
  ],
  user: [
    "tasks:create",
    "tasks:edit",
    "time:track",
    "bucket:manage",
  ],
};

export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  if (user.status === "inactive") return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

export function canManageUsers(user: User | null | undefined): boolean {
  return hasPermission(user, "users:create") || hasPermission(user, "users:edit");
}

export function canDeleteTask(user: User | null | undefined, taskAssigneeIds: string[]): boolean {
  if (!user) return false;
  if (user.role === "admin" || user.role === "manager") return true;
  return taskAssigneeIds.includes(user.id);
}
