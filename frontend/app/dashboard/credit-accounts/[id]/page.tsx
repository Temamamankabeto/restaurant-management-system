"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApiEnvelope, CreditAccount, CreditAccountUser, CreditAccountUserPayload, PaginatedResponse } from "@/types/order-management";

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function date(value?: string) {
  return value ? new Date(value).toLocaleString() : "—";
}

function clean(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") out[key] = value;
  });
  return out;
}

async function getAccount(id: string | number): Promise<CreditAccount> {
  const response = await api.get(`/credit/accounts/${id}`);
  return (response.data as ApiEnvelope<CreditAccount>).data;
}

async function getAuthorizedUsers(accountId: string | number, params: Record<string, unknown>): Promise<PaginatedResponse<CreditAccountUser>> {
  const response = await api.get(`/credit/accounts/${accountId}/users`, { params: clean(params) });
  const body = response.data;
  return {
    success: body?.success,
    message: body?.message,
    data: Array.isArray(body?.data) ? body.data : [],
    meta: body?.meta ?? { current_page: 1, per_page: 10, total: 0, last_page: 1 },
  };
}

async function createAuthorizedUser(accountId: string | number, payload: CreditAccountUserPayload) {
  const response = await api.post(`/credit/accounts/${accountId}/users`, payload);
  return response.data;
}

async function updateAuthorizedUser(id: string | number, payload: CreditAccountUserPayload) {
  const response = await api.put(`/credit/account-users/${id}`, payload);
  return response.data;
}

async function toggleAuthorizedUser(id: string | number) {
  const response = await api.patch(`/credit/account-users/${id}/toggle`);
  return response.data;
}

const emptyForm = {
  full_name: "",
  phone: "",
  employee_id: "",
  position: "",
  id_number: "",
  daily_limit: "",
  monthly_limit: "",
  is_active: "1",
};

type FormState = typeof emptyForm;

function formFromUser(user: CreditAccountUser): FormState {
  return {
    full_name: user.full_name ?? "",
    phone: user.phone ?? "",
    employee_id: user.employee_id ?? "",
    position: user.position ?? "",
    id_number: user.id_number ?? "",
    daily_limit: user.daily_limit === null || user.daily_limit === undefined ? "" : String(user.daily_limit),
    monthly_limit: user.monthly_limit === null || user.monthly_limit === undefined ? "" : String(user.monthly_limit),
    is_active: user.is_active ? "1" : "0",
  };
}

export default function CreditAccountUsersPage() {
  const params = useParams<{ id: string }>();
  const accountId = params.id;
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, per_page: 10, search: "", active: "all" });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditAccountUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const accountQuery = useQuery({ queryKey: ["credit-account-detail", accountId], queryFn: () => getAccount(accountId), enabled: Boolean(accountId) });
  const usersQuery = useQuery({ queryKey: ["credit-account-users", accountId, filters], queryFn: () => getAuthorizedUsers(accountId, filters), enabled: Boolean(accountId) });

  const account = accountQuery.data;
  const rows = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: CreditAccountUserPayload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        employee_id: form.employee_id.trim() || undefined,
        position: form.position.trim() || undefined,
        id_number: form.id_number.trim() || undefined,
        daily_limit: form.daily_limit === "" ? null : Number(form.daily_limit),
        monthly_limit: form.monthly_limit === "" ? null : Number(form.monthly_limit),
        is_active: form.is_active === "1",
      };
      return editing ? updateAuthorizedUser(editing.id, payload) : createAuthorizedUser(accountId, payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Authorized user updated" : "Authorized user added");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["credit-account-users", accountId] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to save authorized user"),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleAuthorizedUser,
    onSuccess: () => {
      toast.success("Authorized user status updated");
      queryClient.invalidateQueries({ queryKey: ["credit-account-users", accountId] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update authorized user"),
  });

  const totals = useMemo(() => {
    const active = rows.filter((row) => Boolean(row.is_active)).length;
    const inactive = rows.length - active;
    return { active, inactive, total: rows.length };
  }, [rows]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(user: CreditAccountUser) {
    setEditing(user);
    setForm(formFromUser(user));
    setOpen(true);
  }

  function submit() {
    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    saveMutation.mutate();
  }

  const limit = Number(account?.credit_limit ?? 0);
  const balance = Number(account?.current_balance ?? 0);
  const available = Math.max(0, limit - balance);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/credit-accounts"><ArrowLeft className="mr-2 h-4 w-4" /> Back to credit accounts</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Authorized Users</h1>
            <p className="text-muted-foreground">Manage people allowed to use {account?.name ?? "this organization"} credit account.</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add user</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl"><CardHeader><CardDescription>Account</CardDescription><CardTitle>{accountQuery.isLoading ? "Loading..." : account?.name}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader><CardDescription>Available limit</CardDescription><CardTitle>{money(available)}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader><CardDescription>Active users</CardDescription><CardTitle>{totals.active}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader><CardDescription>Disabled users</CardDescription><CardTitle>{totals.inactive}</CardTitle></CardHeader></Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Authorized user list</CardTitle>
              <CardDescription>Only active users will appear in the cashier POS selector.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 md:w-72" placeholder="Search name, phone, employee ID" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Select value={filters.active} onValueChange={(active) => setFilters((current) => ({ ...current, active, page: 1 }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setFilters({ page: 1, per_page: 10, search: "", active: "all" })}>Reset filters</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Daily limit</TableHead>
                  <TableHead>Monthly limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading authorized users...</TableCell></TableRow>
                ) : rows.length ? rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell><div className="font-medium">{user.full_name}</div><div className="text-xs text-muted-foreground">Created {date(user.created_at)}</div></TableCell>
                    <TableCell>{user.phone || "—"}</TableCell>
                    <TableCell>{user.employee_id || "—"}</TableCell>
                    <TableCell>{user.position || "—"}</TableCell>
                    <TableCell>{user.daily_limit ? money(user.daily_limit) : "No limit"}</TableCell>
                    <TableCell>{user.monthly_limit ? money(user.monthly_limit) : "No limit"}</TableCell>
                    <TableCell><Badge variant={user.is_active ? "outline" : "destructive"}>{user.is_active ? "Active" : "Disabled"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}><Edit className="mr-2 h-4 w-4" /> Edit user</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMutation.mutate(user.id)}>{user.is_active ? "Disable user" : "Enable user"}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No authorized users found. Add one so cashier can use this organization credit account.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1}</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={(meta?.current_page ?? 1) <= 1} onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}>Previous</Button>
              <Button variant="outline" disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit authorized user" : "Add authorized user"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>Full name</Label><Input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Example: Abebe Kebede" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="0911..." /></div>
              <div className="space-y-2"><Label>Employee ID</Label><Input value={form.employee_id} onChange={(event) => setForm({ ...form, employee_id: event.target.value })} placeholder="MUN-001" /></div>
              <div className="space-y-2"><Label>Position</Label><Input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} placeholder="Officer" /></div>
              <div className="space-y-2"><Label>ID number</Label><Input value={form.id_number} onChange={(event) => setForm({ ...form, id_number: event.target.value })} /></div>
              <div className="space-y-2"><Label>Daily limit</Label><Input type="number" min="0" value={form.daily_limit} onChange={(event) => setForm({ ...form, daily_limit: event.target.value })} placeholder="Optional" /></div>
              <div className="space-y-2"><Label>Monthly limit</Label><Input type="number" min="0" value={form.monthly_limit} onChange={(event) => setForm({ ...form, monthly_limit: event.target.value })} placeholder="Optional" /></div>
              <div className="space-y-2"><Label>Status</Label><Select value={form.is_active} onValueChange={(is_active) => setForm({ ...form, is_active })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Active</SelectItem><SelectItem value="0">Disabled</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saveMutation.isPending} onClick={submit}>{editing ? "Update user" : "Save user"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
