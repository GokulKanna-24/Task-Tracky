export type UserRole = "admin" | "manager" | "user";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  passwordHash?: string;
  salt?: string;
  avatarUrl?: string;
  lastLoginAt?: number | null;
  createdAt: number;
  updatedAt?: number;
}