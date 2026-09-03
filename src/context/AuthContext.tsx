import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { authEngine, type RegisterInput } from "@/engines/auth/auth.engine";
import { hasPermission, canManageUsers, canDeleteTask, type Permission } from "@/engines/auth/rbac";
import type { User } from "@/engines/user.types";

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<User>;
  refetchUser: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  canManageUsers: boolean;
  canDeleteTask: (taskAssigneeIds: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetchUser = useCallback(async () => {
    try {
      const user = await authEngine.getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error("Error fetching current user", e);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const user = await authEngine.login(email, password);
    setCurrentUser(user);
    return user;
  };

  const register = async (input: RegisterInput): Promise<User> => {
    const user = await authEngine.register(input);
    setCurrentUser(user);
    return user;
  };

  const logout = async (): Promise<void> => {
    await authEngine.logout();
    await refetchUser();
  };

  const switchUser = async (userId: string): Promise<User> => {
    const user = await authEngine.switchUser(userId);
    setCurrentUser(user);
    return user;
  };

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(currentUser, permission);
  };

  const userCanManageUsers = canManageUsers(currentUser);

  const checkCanDeleteTask = (taskAssigneeIds: string[]): boolean => {
    return canDeleteTask(currentUser, taskAssigneeIds);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser && currentUser.status !== "inactive"),
        isLoading,
        login,
        register,
        logout,
        switchUser,
        refetchUser,
        hasPermission: checkPermission,
        canManageUsers: userCanManageUsers,
        canDeleteTask: checkCanDeleteTask,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
