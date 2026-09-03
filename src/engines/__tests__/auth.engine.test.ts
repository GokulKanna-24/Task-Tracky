import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/database/db";
import { authEngine } from "@/engines/auth/auth.engine";
import { hasPermission, canDeleteTask } from "@/engines/auth/rbac";
import type { User } from "@/engines/user.types";

describe("Auth Engine & RBAC", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("registers a new user and authenticates successfully", async () => {
    const user = await authEngine.register({
      email: "testadmin@tracky.app",
      password: "SecurePassword123!",
      fullName: "Test Admin",
      role: "admin",
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("testadmin@tracky.app");
    expect(user.role).toBe("admin");
    expect(user.passwordHash).toBeDefined();

    // Verify login
    const loggedIn = await authEngine.login("testadmin@tracky.app", "SecurePassword123!");
    expect(loggedIn.id).toBe(user.id);
  });

  it("rejects login with incorrect password or inactive status", async () => {
    const user = await authEngine.register({
      email: "user@tracky.app",
      password: "Password123!",
      fullName: "Regular User",
    });

    // Wrong password
    await expect(authEngine.login("user@tracky.app", "WrongPassword")).rejects.toThrow(
      "Invalid email or password"
    );

    // Inactive status
    await authEngine.updateUser(user.id, { status: "inactive" });
    await expect(authEngine.login("user@tracky.app", "Password123!")).rejects.toThrow(
      "Account is inactive"
    );
  });

  it("switches user accounts", async () => {
    const admin = await authEngine.register({
      email: "admin@tracky.app",
      password: "Password123!",
      fullName: "Admin",
      role: "admin",
    });

    const member = await authEngine.register({
      email: "member@tracky.app",
      password: "Password123!",
      fullName: "Member",
      role: "user",
    });

    await authEngine.switchUser(admin.id);
    let current = await authEngine.getCurrentUser();
    expect(current?.id).toBe(admin.id);

    await authEngine.switchUser(member.id);
    current = await authEngine.getCurrentUser();
    expect(current?.id).toBe(member.id);
  });

  it("enforces RBAC permissions based on role", async () => {
    const adminUser: User = {
      id: "u1",
      email: "admin@test.com",
      fullName: "Admin",
      role: "admin",
      status: "active",
      createdAt: Date.now(),
    };

    const managerUser: User = {
      id: "u2",
      email: "manager@test.com",
      fullName: "Manager",
      role: "manager",
      status: "active",
      createdAt: Date.now(),
    };

    const regularUser: User = {
      id: "u3",
      email: "user@test.com",
      fullName: "User",
      role: "user",
      status: "active",
      createdAt: Date.now(),
    };

    // Admin permissions
    expect(hasPermission(adminUser, "users:create")).toBe(true);
    expect(hasPermission(adminUser, "projects:delete")).toBe(true);

    // Manager permissions
    expect(hasPermission(managerUser, "projects:create")).toBe(true);
    expect(hasPermission(managerUser, "users:create")).toBe(false);

    // Regular user permissions
    expect(hasPermission(regularUser, "tasks:create")).toBe(true);
    expect(hasPermission(regularUser, "projects:create")).toBe(false);
    expect(hasPermission(regularUser, "users:create")).toBe(false);

    // Task deletion permissions
    expect(canDeleteTask(adminUser, ["u3"])).toBe(true);
    expect(canDeleteTask(managerUser, ["u3"])).toBe(true);
    expect(canDeleteTask(regularUser, ["u3"])).toBe(true); // assigned
    expect(canDeleteTask(regularUser, ["u1"])).toBe(false); // not assigned
  });
});
