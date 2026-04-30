"use client";

import { useMemo, useState } from "react";
import { Layers, Plus, RefreshCw, Search, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignWaiterModal } from "@/components/table-management/assign-waiter-modal";
import { BulkAssignTablesModal } from "@/components/table-management/bulk-assign-tables-modal";
import { TableActionsDropdown } from "@/components/table-management/table-actions-dropdown";
import { TableFormModal } from "@/components/table-management/table-form-modal";
import { TableStatusBadge } from "@/components/table-management/table-status-badge";
import { TransferOrdersModal } from "@/components/table-management/transfer-orders-modal";
import {
  DiningTable,
  TableListParams,
  TableStatus,
  TableWaiter,
  useTableSectionsQuery,
  useTableSummaryQuery,
  useTablesQuery,
} from "@/hooks/table-management/table";
import { can, tablePermissions } from "@/lib/auth/permissions";

const statuses: Array<TableStatus | "all"> = ["all", "available", "occupied", "reserved", "cleaning", "out_of_service"];

function asNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString();
}

function formatLabel(value: unknown) {
  return String(value ?? "—").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function tableTitle(table: DiningTable) {
  return table.table_number ?? table.number ?? table.name ?? `Table #${table.id}`;
}

function waiterDisplayName(waiter?: TableWaiter | null) {
  if (!waiter?.id) return "—";
  return waiter.name ?? waiter.full_name ?? waiter.username ?? waiter.email ?? `Waiter #${waiter.id}`;
}

function waiterNames(table: DiningTable) {
  const waiters = table.waiters ?? [];
  if (waiters.length) return waiters.map(waiterDisplayName).filter((name) => name !== "—").join(", ") || "—";
  return waiterDisplayName(table.waiter ?? table.assigned_waiter ?? null);
}

export default function TableManagementPage() {
  const [params, setParams] = useState<TableListParams>({
    page: 1,
    per_page: 10,
    status: "all",
    is_active: "all",
    section: "all",
    search: "",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selected, setSelected] = useState<DiningTable | null>(null);

  const tablesQuery = useTablesQuery(params);
  const summaryQuery = useTableSummaryQuery();
  const sectionsQuery = useTableSectionsQuery();

  const rows = tablesQuery.data?.data ?? [];
  const meta = tablesQuery.data?.meta;
  const summary = useMemo(
    () => ({ ...(tablesQuery.data?.summary ?? {}), ...(summaryQuery.data ?? {}) }),
    [tablesQuery.data?.summary, summaryQuery.data],
  );

  function updateParam(next: Partial<TableListParams>) {
    setParams((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  }

  function openCreate() {
    setSelected(null);
    setFormOpen(true);
  }

  function openEdit(table: DiningTable) {
    setSelected(table);
    setFormOpen(true);
  }

  function openAssign(table: DiningTable) {
    setSelected(table);
    setAssignOpen(true);
  }

  function openTransfer(table: DiningTable) {
    setSelected(table);
    setTransferOpen(true);
  }

  function openOrders(table: DiningTable) {
    setSelected(table);
    setOrdersOpen(true);
  }

  const cards = [
    { label: "Total", value: summary.total ?? meta?.total ?? rows.length, icon: Table2 },
    { label: "Available", value: summary.available ?? summary.by_status?.available ?? 0, icon: Layers },
    { label: "Occupied", value: summary.occupied ?? summary.by_status?.occupied ?? 0, icon: Layers },
    { label: "Reserved", value: summary.reserved ?? summary.by_status?.reserved ?? 0, icon: Layers },
    { label: "Cleaning", value: summary.cleaning ?? summary.by_status?.cleaning ?? 0, icon: Layers },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Table Management</h1>
          <p className="text-sm text-muted-foreground">Create tables, assign waiters, and manage table status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => tablesQuery.refetch()} disabled={tablesQuery.isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          {can(tablePermissions.assign) && (
            <Button variant="outline" onClick={() => setBulkAssignOpen(true)}>Bulk assign</Button>
          )}
          {can(tablePermissions.create) && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add table
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{asNumber(card.value)}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_150px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search table number, name, or section"
                value={String(params.search ?? "")}
                onChange={(event) => updateParam({ search: event.target.value })}
              />
            </div>

            <Select value={String(params.status ?? "all")} onValueChange={(value) => updateParam({ status: value })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>{formatLabel(status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(params.section ?? "all")} onValueChange={(value) => updateParam({ section: value })}>
              <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {(sectionsQuery.data ?? []).map((section) => (
                  <SelectItem key={String(section)} value={String(section)}>{formatLabel(section)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(params.is_active ?? "all")} onValueChange={(value) => updateParam({ is_active: value })}>
              <SelectTrigger><SelectValue placeholder="Active" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border">
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
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading tables...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((table) => (
                    <TableRow key={String(table.id)}>
                      <TableCell>
                        <div className="font-medium">{tableTitle(table)}</div>
                        <div className="text-xs text-muted-foreground">{table.name || `ID: ${table.id}`}</div>
                      </TableCell>
                      <TableCell>{table.section ? formatLabel(table.section) : "—"}</TableCell>
                      <TableCell>{table.capacity ?? "—"}</TableCell>
                      <TableCell><TableStatusBadge status={table.status} /></TableCell>
                      <TableCell>{waiterNames(table)}</TableCell>
                      <TableCell>{Number(table.is_active ?? table.active ?? 1) === 1 ? "Active" : "Inactive"}</TableCell>
                      <TableCell className="text-right">
                        <TableActionsDropdown
                          table={table}
                          onEdit={() => openEdit(table)}
                          onAssign={() => openAssign(table)}
                          onTransfer={() => openTransfer(table)}
                          onTransferOrders={() => openOrders(table)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No tables found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing page {meta?.current_page ?? params.page ?? 1} of {meta?.last_page ?? 1}. Total: {meta?.total ?? rows.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={Number(params.page ?? 1) <= 1 || tablesQuery.isFetching}
                onClick={() => updateParam({ page: Number(params.page ?? 1) - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={Number(params.page ?? 1) >= Number(meta?.last_page ?? 1) || tablesQuery.isFetching}
                onClick={() => updateParam({ page: Number(params.page ?? 1) + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TableFormModal open={formOpen} onOpenChange={setFormOpen} table={selected} />
      <AssignWaiterModal open={assignOpen} onOpenChange={setAssignOpen} table={selected} mode="assign" />
      <AssignWaiterModal open={transferOpen} onOpenChange={setTransferOpen} table={selected} mode="transfer" />
      <TransferOrdersModal open={ordersOpen} onOpenChange={setOrdersOpen} table={selected} />
      <BulkAssignTablesModal open={bulkAssignOpen} onOpenChange={setBulkAssignOpen} />
    </div>
  );
}
