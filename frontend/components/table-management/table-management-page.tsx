"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RefreshCw, Search, Users, ArrowRightLeft, History, Power, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DiningTable,
  TablePayload,
  TableStatus,
  useAssignTableWaiterMutation,
  useCreateTableMutation,
  useSetTableStatusMutation,
  useTableHistoryQuery,
  useTableSectionsQuery,
  useTableSummaryQuery,
  useTableWaitersQuery,
  useTablesQuery,
  useToggleTableActiveMutation,
  useTransferTableMutation,
  useTransferTableOrdersMutation,
  useUnassignTableWaiterMutation,
  useUpdateTableMutation,
} from "@/hook/table-management/table";

const TABLE_STATUSES: TableStatus[] = ["available", "occupied", "reserved", "cleaning", "out_of_service"];

function label(value: unknown) {
  return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function tableLabel(table?: DiningTable | null) {
  if (!table) return "Table";
  return String(table.table_number ?? table.number ?? table.name ?? `#${table.id}`);
}

function waiterName(table: DiningTable) {
  return table.waiter?.name ?? table.waiter?.full_name ?? "Not assigned";
}

function isActive(table: DiningTable) {
  return Boolean(table.is_active ?? table.active ?? true);
}

function statusBadgeVariant(status?: string) {
  if (status === "available") return "default" as const;
  if (status === "occupied") return "destructive" as const;
  if (status === "reserved") return "secondary" as const;
  return "outline" as const;
}

function initialForm(table?: DiningTable | null): TablePayload {
  return {
    table_number: String(table?.table_number ?? table?.number ?? ""),
    name: String(table?.name ?? ""),
    section: String(table?.section ?? ""),
    capacity: String(table?.capacity ?? ""),
    status: table?.status ?? "available",
    is_active: Boolean(table?.is_active ?? table?.active ?? true),
  };
}

function SummaryCard({ title, value, description }: { title: string; value: unknown; description?: string }) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{Number(value ?? 0).toLocaleString()}</CardTitle>
      </CardHeader>
      {description ? <CardContent className="px-4 text-xs text-muted-foreground">{description}</CardContent> : null}
    </Card>
  );
}

function TableFormDialog({
  open,
  onOpenChange,
  table,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: DiningTable | null;
}) {
  const [form, setForm] = useState<TablePayload>(() => initialForm(table));
  const createMutation = useCreateTableMutation();
  const updateMutation = useUpdateTableMutation();

  function reset(nextTable: DiningTable | null) {
    setForm(initialForm(nextTable));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: TablePayload = {
      ...form,
      capacity: form.capacity === "" ? null : Number(form.capacity),
      section: form.section ? String(form.section) : null,
    };

    try {
      if (table?.id) {
        await updateMutation.mutateAsync({ id: table.id, payload });
        toast.success("Table updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Table created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save table");
    }
  }

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) reset(table);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{table ? "Edit table" : "Create table"}</DialogTitle>
          <DialogDescription>Manage table number, section, capacity and default status.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Table number</Label>
              <Input
                value={String(form.table_number ?? "")}
                onChange={(event) => setForm((prev) => ({ ...prev, table_number: event.target.value }))}
                placeholder="T-01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={String(form.name ?? "")}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Family table"
              />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Input
                value={String(form.section ?? "")}
                onChange={(event) => setForm((prev) => ({ ...prev, section: event.target.value }))}
                placeholder="Main hall"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                min="1"
                value={String(form.capacity ?? "")}
                onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
                placeholder="4"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={String(form.status ?? "available")} onValueChange={(status) => setForm((prev) => ({ ...prev, status }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {TABLE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{label(status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ table, onOpenChange }: { table: DiningTable | null; onOpenChange: (open: boolean) => void }) {
  const waitersQuery = useTableWaitersQuery();
  const assignMutation = useAssignTableWaiterMutation();
  const unassignMutation = useUnassignTableWaiterMutation();
  const [waiterId, setWaiterId] = useState("");

  async function assign() {
    if (!table?.id || !waiterId) return;
    try {
      await assignMutation.mutateAsync({ id: table.id, waiter_id: waiterId });
      toast.success("Waiter assigned successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign waiter");
    }
  }

  async function unassign() {
    if (!table?.id) return;
    try {
      await unassignMutation.mutateAsync(table.id);
      toast.success("Waiter unassigned successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unassign waiter");
    }
  }

  return (
    <Dialog open={Boolean(table)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign waiter - {tableLabel(table)}</DialogTitle>
          <DialogDescription>Select a waiter for this table or remove the current assignment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-sm">
            Current waiter: <span className="font-medium">{table ? waiterName(table) : "—"}</span>
          </div>
          <div className="space-y-2">
            <Label>Waiter</Label>
            <Select value={waiterId} onValueChange={setWaiterId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={waitersQuery.isLoading ? "Loading waiters..." : "Select waiter"} />
              </SelectTrigger>
              <SelectContent>
                {(waitersQuery.data ?? []).map((waiter) => (
                  <SelectItem key={String(waiter.id)} value={String(waiter.id)}>
                    {waiter.name ?? waiter.full_name ?? waiter.email ?? `Waiter #${waiter.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="secondary" onClick={unassign} disabled={!table?.id || unassignMutation.isPending}>Unassign</Button>
          <Button type="button" onClick={assign} disabled={!waiterId || assignMutation.isPending}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({ table, tables, onOpenChange }: { table: DiningTable | null; tables: DiningTable[]; onOpenChange: (open: boolean) => void }) {
  const transferMutation = useTransferTableMutation();
  const transferOrdersMutation = useTransferTableOrdersMutation();
  const [toTableId, setToTableId] = useState("");
  const [mode, setMode] = useState("table");
  const [note, setNote] = useState("");

  async function submit() {
    if (!table?.id || !toTableId) return;
    try {
      const payload = { to_table_id: toTableId, note };
      if (mode === "orders") await transferOrdersMutation.mutateAsync({ id: table.id, payload });
      else await transferMutation.mutateAsync({ id: table.id, payload });
      toast.success(mode === "orders" ? "Orders transferred successfully" : "Table transferred successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfer failed");
    }
  }

  const busy = transferMutation.isPending || transferOrdersMutation.isPending;

  return (
    <Dialog open={Boolean(table)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer - {tableLabel(table)}</DialogTitle>
          <DialogDescription>Move table assignment or transfer active orders to another table.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Transfer type</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Transfer table</SelectItem>
                <SelectItem value="orders">Transfer orders only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Destination table</Label>
            <Select value={toTableId} onValueChange={setToTableId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select destination table" /></SelectTrigger>
              <SelectContent>
                {tables.filter((item) => String(item.id) !== String(table?.id)).map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>{tableLabel(item)} - {label(item.status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={submit} disabled={!toTableId || busy}>Transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ table, onOpenChange }: { table: DiningTable | null; onOpenChange: (open: boolean) => void }) {
  const historyQuery = useTableHistoryQuery(table?.id);
  const rows = historyQuery.data?.data ?? [];

  return (
    <Dialog open={Boolean(table)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>History - {tableLabel(table)}</DialogTitle>
          <DialogDescription>Recent table assignment, status and transfer activity.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[420px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? rows.map((row, index) => (
                <TableRow key={String(row.id ?? index)}>
                  <TableCell>{String(row.created_at ?? row.date ?? "—")}</TableCell>
                  <TableCell>{label(row.action ?? row.type ?? row.status ?? "Activity")}</TableCell>
                  <TableCell>{String(row.note ?? row.description ?? "—")}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No history found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TableManagementPage() {
  const [filters, setFilters] = useState({ search: "", status: "all", section: "all", active: "all", page: 1, per_page: 10 });
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
  const [assignTable, setAssignTable] = useState<DiningTable | null>(null);
  const [transferTable, setTransferTable] = useState<DiningTable | null>(null);
  const [historyTable, setHistoryTable] = useState<DiningTable | null>(null);

  const tablesQuery = useTablesQuery(filters);
  const summaryQuery = useTableSummaryQuery();
  const sectionsQuery = useTableSectionsQuery();
  const setStatusMutation = useSetTableStatusMutation();
  const toggleMutation = useToggleTableActiveMutation();

  const tables = tablesQuery.data?.data ?? [];
  const meta = tablesQuery.data?.meta;
  const summary = summaryQuery.data ?? {};
  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data]);

  function updateFilter(key: string, value: string | number) {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === "page" ? Number(value) : 1 }));
  }

  async function changeStatus(table: DiningTable, status: string) {
    try {
      await setStatusMutation.mutateAsync({ id: table.id, status });
      toast.success("Table status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  }

  async function toggleActive(table: DiningTable) {
    try {
      await toggleMutation.mutateAsync(table.id);
      toast.success("Table active status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update table");
    }
  }

  function openCreate() {
    setEditingTable(null);
    setFormOpen(true);
  }

  function openEdit(table: DiningTable) {
    setEditingTable(table);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Table Management</h1>
          <p className="text-sm text-muted-foreground">Create tables, assign waiters, transfer orders and control table status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => tablesQuery.refetch()} disabled={tablesQuery.isFetching}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add table
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total tables" value={summary.total ?? meta?.total ?? tables.length} description="All configured tables" />
        <SummaryCard title="Available" value={summary.available ?? summary.by_status?.available} />
        <SummaryCard title="Occupied" value={summary.occupied ?? summary.by_status?.occupied} />
        <SummaryCard title="Reserved" value={summary.reserved ?? summary.by_status?.reserved} />
        <SummaryCard title="Inactive" value={summary.inactive} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
          <CardDescription>Filter tables by section, status and active state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_160px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search table number, name or section" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
            </div>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {TABLE_STATUSES.map((status) => <SelectItem key={status} value={status}>{label(status)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.section} onValueChange={(value) => updateFilter("section", value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {sections.map((section) => <SelectItem key={String(section)} value={String(section)}>{label(section)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(filters.active)} onValueChange={(value) => updateFilter("active", value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Active" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waiter</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablesQuery.isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading tables...</TableCell></TableRow>
                ) : tables.length ? tables.map((table) => (
                  <TableRow key={String(table.id)}>
                    <TableCell>
                      <div className="font-medium">{tableLabel(table)}</div>
                      <div className="text-xs text-muted-foreground">{table.name ? String(table.name) : `ID: ${table.id}`}</div>
                    </TableCell>
                    <TableCell>{table.section ? label(table.section) : "—"}</TableCell>
                    <TableCell>{table.capacity ?? "—"}</TableCell>
                    <TableCell>
                      <Select value={String(table.status ?? "available")} onValueChange={(value) => changeStatus(table, value)}>
                        <SelectTrigger className="h-8 w-[145px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TABLE_STATUSES.map((status) => <SelectItem key={status} value={status}>{label(status)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{waiterName(table)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive(table) ? "default" : "outline"}>{isActive(table) ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge variant={statusBadgeVariant(table.status)}>{label(table.status ?? "available")}</Badge>
                        <Button variant="outline" size="sm" onClick={() => openEdit(table)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => setAssignTable(table)}>Assign</Button>
                        <Button variant="outline" size="sm" onClick={() => setTransferTable(table)}><ArrowRightLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => setHistoryTable(table)}><History className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(table)} disabled={toggleMutation.isPending}><Power className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No tables found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing page {meta?.current_page ?? filters.page} of {meta?.last_page ?? 1}. Total: {meta?.total ?? tables.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={Number(filters.page) <= 1} onClick={() => updateFilter("page", Number(filters.page) - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={Number(filters.page) >= Number(meta?.last_page ?? 1)} onClick={() => updateFilter("page", Number(filters.page) + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TableFormDialog open={formOpen} onOpenChange={setFormOpen} table={editingTable} />
      <AssignDialog table={assignTable} onOpenChange={(open) => !open && setAssignTable(null)} />
      <TransferDialog table={transferTable} tables={tables} onOpenChange={(open) => !open && setTransferTable(null)} />
      <HistoryDialog table={historyTable} onOpenChange={(open) => !open && setHistoryTable(null)} />
    </div>
  );
}
