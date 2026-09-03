import { db } from "@/database/db";
import type { User } from "@/engines/user.types";

const CURRENT_USER_KEY = "tasktracky.currentUserId";
let memoryUserId: string | null = null;

export async function setCurrentUserId(id: string): Promise<void> {
  memoryUserId = id || null;
  if (typeof localStorage !== "undefined") {
    try {
      if (!id) {
        localStorage.removeItem(CURRENT_USER_KEY);
      } else {
        localStorage.setItem(CURRENT_USER_KEY, id);
      }
    } catch {
      // ignore
    }
  }
}

export function getCurrentUserId(): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored !== null) return stored;
    } catch {
      // ignore
    }
  }
  return memoryUserId;
}

export async function getCurrentUser(): Promise<User | null> {
  const id = getCurrentUserId();
  if (!id) return null;
  
  const u = await db.users.get(id);
  if (u && u.status !== "inactive") {
    return { ...u, status: u.status || "active" };
  }
  return null;
}