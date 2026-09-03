import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { authEngine, type CreateUserInput } from "@/engines/auth/auth.engine";
import type { User, UserRole, UserStatus } from "@/engines/user.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Shield, ShieldCheck, UserCheck, Search, Edit2, UserX, CheckCircle, Trash2 } from "lucide-react";
import { formatDateTime } from "@/shared/utils/time";
import toast from "react-hot-toast";

export default function UserManagementPage() {
  const { currentUser, switchUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [form, setForm] = useState<CreateUserInput>({
    fullName: "",
    email: "",
    password: "Password123!",
    role: "user",
    status: "active",
  });

  const loadUsers = useCallback(async () => {
    try {
      const data = await authEngine.listUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authEngine.createUser(form);
      toast.success(`User ${form.fullName} created successfully`);
      setCreateOpen(false);
      setForm({ fullName: "", email: "", password: "Password123!", role: "user", status: "active" });
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await authEngine.updateUser(userId, { role: newRole });
      toast.success("User role updated");
      if (editOpen) setEditOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === "active" ? "inactive" : "active";
    try {
      await authEngine.updateUser(user.id, { status: nextStatus });
      toast.success(`Account ${user.fullName} marked as ${nextStatus}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user ${user.fullName}?`)) return;
    try {
      await authEngine.deleteUser(user.id);
      toast.success(`User ${user.fullName} deleted`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleSwitchAccount = async (user: User) => {
    try {
      await switchUser(user.id);
      toast.success(`Switched active session to ${user.fullName}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to switch user");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-300">Admin</Badge>;
      case "manager":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300">Manager</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> User Management & RBAC
          </h1>
          <p className="text-sm text-muted-foreground">Manage user identities, authentication credentials, and permission roles.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Add New User
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Registered local identities</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
            <p className="text-xs text-muted-foreground">Full permission access</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "manager").length}</div>
            <p className="text-xs text-muted-foreground">Project & Task managers</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <CheckCircle className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Enabled user profiles</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-border/60">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Filter Role:</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Loading users…
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`}
                            alt={u.fullName}
                            className="h-9 w-9 rounded-full bg-muted border border-border object-cover"
                          />
                          <div>
                            <div className="font-medium flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">You</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">{getRoleBadge(u.role)}</td>

                      <td className="p-4">
                        {u.status === "active" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Inactive
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-xs text-muted-foreground">
                        {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isSelf && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Switch active session to this user"
                              onClick={() => handleSwitchAccount(u)}
                              className="text-xs gap-1"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-primary" /> Switch
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Role"
                            onClick={() => {
                              setSelectedUser(u);
                              setEditOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>

                          {!isSelf && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={u.status === "active" ? "Deactivate Account" : "Activate Account"}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {u.status === "active" ? (
                                  <UserX className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                                )}
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete User"
                                onClick={() => handleDeleteUser(u)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Local User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div>
              <Label>Full Name</Label>
              <Input
                placeholder="Jane Smith"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="jane@tasktracky.app"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Assigned Role</Label>
              <Select value={form.role} onValueChange={(r) => setForm({ ...form, role: r as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Standard Member)</SelectItem>
                  <SelectItem value="manager">Manager (Project & Task Admin)</SelectItem>
                  <SelectItem value="admin">Admin (Full Control)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground">User</Label>
                <div className="font-semibold">{selectedUser.fullName} ({selectedUser.email})</div>
              </div>

              <div>
                <Label>Role Assignment</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(r) => handleUpdateRole(selectedUser.id, r as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User (Standard Member)</SelectItem>
                    <SelectItem value="manager">Manager (Project & Task Admin)</SelectItem>
                    <SelectItem value="admin">Admin (Full Control)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
