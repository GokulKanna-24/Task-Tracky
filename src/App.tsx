import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { seedIfEmpty } from "@/database/seed";
import { settingsService } from "@/engines/settings.service";
import { useTheme } from "@/hooks/useSettings";
import { ThemeProvider } from "@/app/providers";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import TasksPage from "@/pages/TasksPage";
import TaskDetailsPage from "@/pages/TaskDetailsPage";
import BucketListPage from "@/pages/BucketListPage";
import SchedulerPage from "@/pages/SchedulerPage";
import ProjectsPage from "@/pages/ProjectsPage";
import SettingsPage from "@/pages/SettingsPage";
import PublicTaskPage from "@/pages/PublicTaskPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import UserManagementPage from "@/pages/UserManagementPage";
import { driveSyncEngine } from "@/engines/sync/driveSync.engine";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Verifying Session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function RequireRole({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const { currentUser } = useAuth();
  if (!currentUser || !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppShell() {
  const { theme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (driveSyncEngine.getAccessToken()) {
          try {
            await driveSyncEngine.fetchAndRestoreFromDrive();
          } catch (e) {
            console.warn("Could not fetch Google Drive data on startup:", e);
          }
        }
        await seedIfEmpty();
        await settingsService.ensure();
      } catch (e) {
        console.error("Seed/init error", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Initializing Task-Tracky…</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme} setTheme={setTheme}>
      <AuthProvider>
        <Routes>
          {/* Public Share View */}
          <Route path="/share/task/:shareToken" element={<PublicTaskPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/kanban" element={<TasksPage defaultTab="kanban" />} />
            <Route path="/tasks/list" element={<TasksPage defaultTab="list" />} />
            <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
            <Route path="/bucket" element={<BucketListPage />} />
            <Route path="/bucket/:bucketId" element={<BucketListPage />} />
            <Route path="/scheduler" element={<SchedulerPage />} />
            <Route path="/scheduler/:view" element={<SchedulerPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectsPage />} />
            <Route
              path="/users"
              element={
                <RequireRole roles={["admin", "manager"]}>
                  <UserManagementPage />
                </RequireRole>
              }
            />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
