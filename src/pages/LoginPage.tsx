import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Shield, Lock, Mail, ArrowRight, UserCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, switchUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("you@tasktracky.app");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back to Task-Tracky!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (userId: string, roleName: string) => {
    try {
      await switchUser(userId);
      toast.success(`Logged in as ${roleName}`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to switch user");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-1">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Task-Tracky</h1>
          <p className="text-sm text-muted-foreground">Sign in to your local-first workspace</p>
        </div>

        <Card className="border-border/60 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to access your tasks and timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@tasktracky.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs text-muted-foreground">Default: Password123!</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Quick Account Switcher
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSwitch("user_you", "Admin")}
                className="flex flex-col h-auto py-2 text-xs"
              >
                <UserCheck className="h-4 w-4 text-indigo-500 mb-1" />
                <span className="font-semibold">Admin</span>
                <span className="text-[10px] text-muted-foreground">You</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSwitch("user_john", "Manager")}
                className="flex flex-col h-auto py-2 text-xs"
              >
                <UserCheck className="h-4 w-4 text-emerald-500 mb-1" />
                <span className="font-semibold">Manager</span>
                <span className="text-[10px] text-muted-foreground">John Doe</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSwitch("user_sara", "User")}
                className="flex flex-col h-auto py-2 text-xs"
              >
                <UserCheck className="h-4 w-4 text-sky-500 mb-1" />
                <span className="font-semibold">User</span>
                <span className="text-[10px] text-muted-foreground">Sara Lee</span>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4 text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="ml-1 text-primary hover:underline font-semibold">
              Create an account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
