"use client";

import { useMemo, useState } from "react";
import { Layers, Plus, Search, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignWaiterModal } from "./assign-waiter-modal";
import { BulkAssignTablesModal } from "./bulk-assign-tables-modal";
import { TableActionsDropdown } from "./table-actions-dropdown";
import { TableFormModal } from "./table-form-modal";
import { TableStatusBadge } from "./table-status-badge";
import { TransferOrdersModal } from "./transfer-orders-modal";
import { useTableSectionsQuery, useTableSummaryQuery, useTablesQuery } from "@/queries/table-management";
import type { DiningTable, TableListParams, TableStatus } from "@/types/table-management";
import { can, tablePermissions } from "@/lib/auth/permissions";

const statuses: Array<TableStatus | "all"> = ["all", "available", "occupied", "reserved", "cleaning"];

function asNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString();
}

function waiterNames(table: DiningTable) {
  const waiters = table.waiters ?? [];
  if (waiters.length) return waiters.map((waiter) => waiter.name).join(", ");
  return table.assigned_waiter?.name ?? "—";
}

export function TablesPage() {
  const [params, setParams] = useState<TableListParams>({ page: 1, per_page: 10, status: "all", is_active: "all", section: "all", search: "" });
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
  const summary = useMemo(() => ({ ...(tablesQuery.data?.summary ?? {}), ...(summaryQuery.data ?? {}) }), [tablesQuery.data?.summary, summaryQuery.data]);

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
    { label: "Total", value: summary.total ?? meta?.total ?? rows.length },
    { label: "Available", value: summary.available ?? 0 },
    { label: "Occupied", value: summary.occupied ?? 0 },
    { label: "Reserved", value: summary.reserved ?? 0 },
    { label: "Cleaning", value: summary.cleaning ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Table Management</h1>
          <p className="text-muted-foreground">Manage dining tables, sections, waiter assignments, statuses, and active order transfers.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {can(tablePermissions.assign) && <Button variant="outline" onClick={() => setBulkAssignOpen(true)}><Layers className="mr-2 h-4 w-4" /> Bulk assign</Button>}
          {can(tablePermissions.create) && <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add table</Button>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <Table2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{asNumber(card.value)}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Tables</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 md:w-64" placeholder="Search table..." value={params.search ?? ""} onChange={(e) => updateParam({ search: e.target.value })} />
              </div>
              <Select value={String(params.status ?? "all")} onValueChange={(value) => updateParam({ status: value as TableListParams["status"] })}>
                <SelectTrigger className="md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status === "all" ? "All status" : status}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(params.section ?? "all")} onValueChange={(value) => updateParam({ section: value })}>
                <SelectTrigger className="md:w-44"><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {(sectionsQuery.data ?? []).map((section) => <SelectItem key={section} value={section}>{section}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(params.is_active ?? "all")} onValueChange={(value) => updateParam({ is_active: value as TableListParams["is_active"] })}>
                <SelectTrigger className="md:w-36"><SelectValue placeholder="Active" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Operational</TableHead>
                  <TableHead>Waiters</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablesQuery.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading tables...</TableCell></TableRow>
                ) : rows.length ? rows.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell>
                      <div className="font-medium">{table.table_number}</div>
                      <div className="text-xs text-muted-foreground">{table.name || "—"}</div>
                    </TableCell>
                    <TableCell>{table.section || "—"}</TableCell>
                    <TableCell>{table.capacity}</TableCell>
                    <TableCell><TableStatusBadge status={table.status} /></TableCell>
                    <TableCell><TableStatusBadge status={table.operational_status ?? (table.is_active ? table.status : "inactive")} /></TableCell>
                    <TableCell className="max-w-56 truncate">{waiterNames(table)}</TableCell>
                    <TableCell>{table.is_public ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <TableActionsDropdown table={table} onEdit={() => openEdit(table)} onAssign={() => openAssign(table)} onTransfer={() => openTransfer(table)} onTransferOrders={() => openOrders(table)} />
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No tables found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1} • {meta?.total ?? rows.length} total</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={(meta?.current_page ?? 1) <= 1 || tablesQuery.isFetching} onClick={() => updateParam({ page: Math.max(1, (meta?.current_page ?? 1) - 1) })}>Previous</Button>
              <Button variant="outline" disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1) || tablesQuery.isFetching} onClick={() => updateParam({ page: (meta?.current_page ?? 1) + 1 })}>Next</Button>
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
