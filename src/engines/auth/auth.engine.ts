import { db } from "@/database/db";
import { hashPassword, verifyPassword } from "@/shared/utils/crypto";
import { createUserId } from "@/shared/utils/ids";
import { now } from "@/shared/utils/time";
import { setCurrentUserId, getCurrentUserId } from "@/engines/session";
import type { User, UserRole, UserStatus } from "@/engines/user.types";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  avatarUrl?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  status?: UserStatus;
  avatarUrl?: string;
}

class AuthEngine {
  async getCurrentUser(): Promise<User | null> {
    const currentId = getCurrentUserId();
    if (!currentId) return null;

    const user = await db.users.get(currentId);
    if (!user) return null;

    const status = user.status || "active";
    if (status === "inactive") return null;

    return { ...user, status };
  }

  async login(email: string, password: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await db.users.where("email").equals(trimmedEmail).first();
    
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const status = user.status || "active";
    if (status === "inactive") {
      throw new Error("Account is inactive. Please contact an administrator.");
    }

    if (user.passwordHash && user.salt) {
      const isValid = await verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) {
        throw new Error("Invalid email or password");
      }
    }

    const updatedUser: User = { ...user, status, lastLoginAt: now(), updatedAt: now() };
    await db.users.put(updatedUser);
    await setCurrentUserId(updatedUser.id);
    return updatedUser;
  }

  async register(input: RegisterInput): Promise<User> {
    const trimmedEmail = input.email.trim().toLowerCase();
    const existing = await db.users.where("email").equals(trimmedEmail).first();
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const { hash, salt } = await hashPassword(input.password);
    const ts = now();

    const totalUsers = await db.users.count();
    const assignedRole: UserRole = input.role || (totalUsers === 0 ? "admin" : "user");

    const newUser: User = {
      id: createUserId(),
      email: trimmedEmail,
      fullName: input.fullName,
      role: assignedRole,
      status: "active",
      passwordHash: hash,
      salt: salt,
      avatarUrl: input.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.fullName)}`,
      createdAt: ts,
      updatedAt: ts,
      lastLoginAt: ts,
    };

    await db.users.add(newUser);
    await setCurrentUserId(newUser.id);
    return newUser;
  }

  async logout(): Promise<void> {
    await setCurrentUserId("");
  }

  async switchUser(userId: string): Promise<User> {
    const user = await db.users.get(userId);
    if (!user) throw new Error("User not found");
    const status = user.status || "active";
    if (status === "inactive") throw new Error("Cannot switch to an inactive user account");
    const updatedUser: User = { ...user, status };
    await db.users.put(updatedUser);
    await setCurrentUserId(user.id);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    const users = await db.users.toArray();
    return users.map(u => ({ ...u, status: u.status || "active" }));
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const trimmedEmail = input.email.trim().toLowerCase();
    const existing = await db.users.where("email").equals(trimmedEmail).first();
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const { hash, salt } = await hashPassword(input.password);
    const ts = now();

    const newUser: User = {
      id: createUserId(),
      email: trimmedEmail,
      fullName: input.fullName,
      role: input.role,
      status: input.status || "active",
      passwordHash: hash,
      salt: salt,
      avatarUrl: input.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.fullName)}`,
      createdAt: ts,
      updatedAt: ts,
    };

    await db.users.add(newUser);
    return newUser;
  }

  async updateUser(userId: string, changes: Partial<User>): Promise<User> {
    const existing = await db.users.get(userId);
    if (!existing) throw new Error("User not found");

    const updated: User = { ...existing, ...changes, updatedAt: now() };
    await db.users.put(updated);
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    const totalAdmins = await db.users.where("role").equals("admin").and(u => (u.status || "active") === "active").count();
    const user = await db.users.get(userId);
    if (user?.role === "admin" && totalAdmins <= 1) {
      throw new Error("Cannot delete the only active admin account");
    }
    await db.users.delete(userId);
  }
}

export const authEngine = new AuthEngine();
