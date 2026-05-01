"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Edit, MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreditAccountsQuery } from "@/hooks/queries/order-management";
import {
  useCreateCreditAccountMutation,
  useToggleCreditAccountMutation,
  useUpdateCreditAccountMutation,
} from "@/hooks/mutations/order-management";
import type { CreditAccount, CreditAccountPayload } from "@/types/order-management";

const accountTypes = ["customer", "organization", "staff", "student"] as const;
const settlementCycles = ["daily", "weekly", "monthly"] as const;
const accountStatuses = ["active", "blocked"] as const;

const emptyForm = {
  name: "",
  account_type: "organization",
  credit_limit: "0",
  settlement_cycle: "monthly",
  status: "active",
  is_credit_enabled: "1",
  requires_approval: "0",
};

type FormState = typeof emptyForm;

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function date(value?: string) {
  return value ? new Date(value).toLocaleString() : "—";
}

function isEnabled(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function isOrganizationAccount(account?: CreditAccount | null) {
  return String(account?.account_type ?? "").trim().toLowerCase() === "organization";
}

function formFromAccount(account: CreditAccount): FormState {
  return {
    name: account.name ?? "",
    account_type: String(account.account_type ?? "organization").toLowerCase(),
    credit_limit: String(account.credit_limit ?? 0),
    settlement_cycle: String(account.settlement_cycle ?? "monthly").toLowerCase(),
    status: String(account.status ?? "active").toLowerCase(),
    is_credit_enabled: isEnabled(account.is_credit_enabled) ? "1" : "0",
    requires_approval: isEnabled(account.requires_approval) ? "1" : "0",
  };
}

function payloadFromForm(form: FormState): CreditAccountPayload {
  return {
    name: form.name.trim(),
    account_type: form.account_type,
    credit_limit: Number(form.credit_limit || 0),
    settlement_cycle: form.settlement_cycle,
    status: form.status,
    is_credit_enabled: form.is_credit_enabled === "1",
    requires_approval: form.requires_approval === "1",
  };
}

export default function CreditAccountsPage() {
  const [filters, setFilters] = useState({ page: 1, per_page: 10, search: "", account_type: "all", status: "all" });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const query = useCreditAccountsQuery(filters as any);
  const createMutation = useCreateCreditAccountMutation(() => closeForm());
  const updateMutation = useUpdateCreditAccountMutation();
  const toggleMutation = useToggleCreditAccountMutation();

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const saving = createMutation.isPending || updateMutation.isPending;

  const totals = useMemo(() => {
    const active = rows.filter((row) => String(row.status ?? "active") === "active" && isEnabled(row.is_credit_enabled)).length;
    const blocked = rows.filter((row) => String(row.status ?? "active") === "blocked" || !isEnabled(row.is_credit_enabled)).length;
    const limit = rows.reduce((sum, row) => sum + Number(row.credit_limit ?? 0), 0);
    const balance = rows.reduce((sum, row) => sum + Number(row.current_balance ?? 0), 0);
    return { active, blocked, limit, balance, available: Math.max(0, limit - balance) };
  }, [rows]);

  const updateFilter = (patch: Partial<typeof filters>) => setFilters((current) => ({ ...current, ...patch, page: 1 }));

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(account: CreditAccount) {
    setEditing(account);
    setForm(formFromAccount(account));
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function submit() {
    const payload = payloadFromForm(form);

    if (!payload.name) {
      toast.error("Account name is required");
      return;
    }

    if (Number.isNaN(payload.credit_limit) || Number(payload.credit_limit) < 0) {
      toast.error("Credit limit cannot be negative");
      return;
    }

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            toast.success("Credit account updated");
            closeForm();
          },
          onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update credit account"),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => toast.success("Credit account created"),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create credit account"),
    });
  }

  function toggleAccount(account: CreditAccount) {
    toggleMutation.mutate(account.id, {
      onSuccess: () => toast.success("Credit account status updated"),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update account status"),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Accounts</h1>
          <p className="text-muted-foreground">
            Create customer, staff, student, and organization credit accounts for cashier credit orders.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New credit account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl"><CardHeader><CardDescription>Active accounts</CardDescription><CardTitle>{totals.active}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader><CardDescription>Blocked / disabled</CardDescription><CardTitle>{totals.blocked}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader><CardDescription>Total credit limit</CardDescription><CardTitle>{money(totals.limit)}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader><CardDescription>Available credit</CardDescription><CardTitle>{money(totals.available)}</CardTitle></CardHeader></Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Credit account list</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 md:w-72" placeholder="Search account name" value={filters.search} onChange={(event) => updateFilter({ search: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Select value={filters.account_type} onValueChange={(account_type) => updateFilter({ account_type })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {accountTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(status) => updateFilter({ status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {accountStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setFilters({ page: 1, per_page: 10, search: "", account_type: "all", status: "all" })}>Reset filters</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading credit accounts...</TableCell></TableRow>
                ) : rows.length ? rows.map((account) => {
                  const limit = Number(account.credit_limit ?? 0);
                  const balance = Number(account.current_balance ?? 0);
                  const available = Number(account.remaining_limit ?? Math.max(0, limit - balance));
                  return (
                    <TableRow key={account.id}>
                      <TableCell><div className="font-medium">{account.name}</div><div className="text-xs text-muted-foreground">Created {date(account.created_at)}</div></TableCell>
                      <TableCell className="capitalize">{String(account.account_type ?? "—")}</TableCell>
                      <TableCell>{money(limit)}</TableCell>
                      <TableCell>{money(balance)}</TableCell>
                      <TableCell>{money(available)}</TableCell>
                      <TableCell className="capitalize">{account.settlement_cycle ?? "monthly"}</TableCell>
                      <TableCell>
                        <Badge variant={String(account.status ?? "active") === "active" ? "outline" : "destructive"} className="capitalize">{account.status ?? "active"}</Badge>
                        <div className="text-xs text-muted-foreground">{isEnabled(account.is_credit_enabled) ? "Credit enabled" : "Credit disabled"}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(account)}><Edit className="mr-2 h-4 w-4" /> Edit account</DropdownMenuItem>
                            {isOrganizationAccount(account) && <DropdownMenuItem asChild><Link href={`/dashboard/order-management/credit-accounts/${account.id}`}><Users className="mr-2 h-4 w-4" /> Manage authorized users</Link></DropdownMenuItem>}
                            <DropdownMenuItem disabled={toggleMutation.isPending} onClick={() => toggleAccount(account)}>{String(account.status) === "blocked" || !isEnabled(account.is_credit_enabled) ? "Unblock / enable" : "Block / disable"}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No credit accounts found. Create one to allow credit orders.</TableCell></TableRow>
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

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : closeForm())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit credit account" : "Create credit account"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Account name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Example: Municipality, ICT Department" /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Account type</Label><Select value={form.account_type} onValueChange={(account_type) => setForm({ ...form, account_type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accountTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Credit limit</Label><Input type="number" min="0" value={form.credit_limit} onChange={(event) => setForm({ ...form, credit_limit: event.target.value })} /></div>
              <div className="space-y-2"><Label>Settlement cycle</Label><Select value={form.settlement_cycle} onValueChange={(settlement_cycle) => setForm({ ...form, settlement_cycle })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{settlementCycles.map((cycle) => <SelectItem key={cycle} value={cycle}>{cycle}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accountStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Credit enabled</Label><Select value={form.is_credit_enabled} onValueChange={(is_credit_enabled) => setForm({ ...form, is_credit_enabled })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Yes</SelectItem><SelectItem value="0">No</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Requires approval</Label><Select value={form.requires_approval} onValueChange={(requires_approval) => setForm({ ...form, requires_approval })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={closeForm}>Cancel</Button><Button disabled={saving} onClick={submit}>{editing ? "Update account" : "Save account"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
