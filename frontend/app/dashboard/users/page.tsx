"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit, KeyRound, Loader2, MoreHorizontal, Plus, RefreshCw, Search, Trash2, UserCheck, UserX } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useToggleUserMutation,
  useUpdateUserMutation,
  useUserRolesLiteQuery,
  useUsersQuery,
} from "@/hooks";
import { createUserSchema, resetUserPasswordSchema, updateUserSchema } from "@/lib/schemas/user.schema";
import type { CreateUserPayload, UpdateUserPayload, UserItem, UserStatus } from "@/types/user-management/user.type";

const defaultCreateForm: CreateUserPayload = { name: "", email: "", phone: "", password: "", role: "" };
const defaultEditForm: UpdateUserPayload = { name: "", email: "", phone: "", role: "" };

function getUserRole(user: UserItem) {
  if (user.role) return user.role;
  const firstRole = user.roles?.[0];
  if (!firstRole) return "—";
  return typeof firstRole === "string" ? firstRole : firstRole.name;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function mutationBusy(...flags: boolean[]) {
  return flags.some(Boolean);
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserPayload>(defaultCreateForm);
  const [editForm, setEditForm] = useState<UpdateUserPayload>(defaultEditForm);
  const [newPassword, setNewPassword] = useState("");

  const params = useMemo(() => ({ search, status, page, per_page: 10 }), [search, status, page]);
  const usersQuery = useUsersQuery(params);
  const rolesQuery = useUserRolesLiteQuery();
  const roles = rolesQuery.data ?? [];

  const createMutation = useCreateUserMutation(() => {
    setCreateOpen(false);
    setCreateForm(defaultCreateForm);
  });
  const updateMutation = useUpdateUserMutation(() => {
    setEditOpen(false);
    setSelectedUser(null);
  });
  const toggleMutation = useToggleUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const resetMutation = useResetUserPasswordMutation(() => {
    setResetOpen(false);
    setSelectedUser(null);
    setNewPassword("");
  });

  const rows = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;
  const isBusy = mutationBusy(createMutation.isPending, updateMutation.isPending, resetMutation.isPending);

  function runAfterMenuClose(action: () => void) {
    window.setTimeout(action, 0);
  }

  function openEdit(user: UserItem) {
    const userRole = getUserRole(user);
    setSelectedUser(user);
    setEditForm({ name: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "", role: userRole === "—" ? "" : userRole });
    setEditOpen(true);
  }

  function openReset(user: UserItem) {
    setSelectedUser(user);
    setNewPassword("");
    setResetOpen(true);
  }

  function submitCreate(event: FormEvent) {
    event.preventDefault();
    const payload = createUserSchema.parse(createForm);
    createMutation.mutate(payload);
  }

  function submitEdit(event: FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    const payload = updateUserSchema.parse(editForm);
    updateMutation.mutate({ id: selectedUser.id, payload });
  }

  function submitReset(event: FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    const payload = resetUserPasswordSchema.parse({ new_password: newPassword });
    resetMutation.mutate({ id: selectedUser.id, payload });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage users, roles, status, and password resets.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>User List</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 md:w-72"
                  placeholder="Search name, email or phone..."
                  value={search}
                  onChange={(event) => { setPage(1); setSearch(event.target.value); }}
                />
              </div>
              <Select value={status} onValueChange={(value) => { setPage(1); setStatus(value as UserStatus | "all"); }}>
                <SelectTrigger className="md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => usersQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading users...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No users found</TableCell></TableRow>
                  ) : rows.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone ?? "—"}</TableCell>
                      <TableCell>{getUserRole(user)}</TableCell>
                      <TableCell><Badge variant={user.status === "disabled" ? "secondary" : "default"}>{user.status ?? "active"}</Badge></TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => runAfterMenuClose(() => openEdit(user))}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => runAfterMenuClose(() => toggleMutation.mutate(user.id))}>
                              {user.status === "disabled" ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                              {user.status === "disabled" ? "Enable" : "Disable"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => runAfterMenuClose(() => openReset(user))}><KeyRound className="mr-2 h-4 w-4" /> Reset password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => runAfterMenuClose(() => setDeleteUser(user))}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {meta.current_page} of {meta.last_page} • {meta.total} users</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((current) => current + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Add a new user and assign one backend role.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitCreate}>
            <UserFields form={createForm} roles={roles.map((role) => role.name)} onChange={setCreateForm} includePassword />
            <Button className="w-full" disabled={isBusy}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save user</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile information and role.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEdit}>
            <UserFields form={editForm} roles={roles.map((role) => role.name)} onChange={setEditForm} />
            <Button className="w-full" disabled={isBusy}>{updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update user</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.name ?? "this user"}.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitReset}>
            <div className="grid gap-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={6} /></div>
            <Button className="w-full" disabled={resetMutation.isPending}>{resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reset password</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteUser)} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>This will delete {deleteUser?.name}. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteUser) deleteMutation.mutate(deleteUser.id); setDeleteUser(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserFields<T extends CreateUserPayload | UpdateUserPayload>({ form, roles, onChange, includePassword = false }: { form: T; roles: string[]; onChange: (form: T) => void; includePassword?: boolean }) {
  return (
    <>
      <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required /></div>
      <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} required /></div>
      <div className="grid gap-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} required /></div>
      <div className="grid gap-2">
        <Label>Role</Label>
        <Select value={form.role} onValueChange={(role) => onChange({ ...form, role })}>
          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>{roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {includePassword && "password" in form && (
        <div className="grid gap-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} required minLength={6} /></div>
      )}
    </>
  );
}
