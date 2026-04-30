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
import {
  DiningTable,
  TableListParams,
  TableStatus,
  useTableSectionsQuery,
  useTableSummaryQuery,
  useTablesQuery,
} from "@/hooks/table-management/table";
import { can, tablePermissions } from "@/lib/auth/permissions";

const statuses: Array<TableStatus | "all"> = ["all", "available", "occupied", "reserved", "cleaning", "out_of_service"];

function asNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString();
}

function waiterNames(table: DiningTable) {
  const waiters = table.waiters ?? [];
  if (waiters.length) return waiters.map((waiter) => waiter.name ?? waiter.full_name ?? waiter.email).join(", ");
  return table.waiter?.name ?? "—";
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
      {/* unchanged UI */}
      <TableFormModal open={formOpen} onOpenChange={setFormOpen} table={selected} />
      <AssignWaiterModal open={assignOpen} onOpenChange={setAssignOpen} table={selected} mode="assign" />
      <AssignWaiterModal open={transferOpen} onOpenChange={setTransferOpen} table={selected} mode="transfer" />
      <TransferOrdersModal open={ordersOpen} onOpenChange={setOrdersOpen} table={selected} />
      <BulkAssignTablesModal open={bulkAssignOpen} onOpenChange={setBulkAssignOpen} />
    </div>
  );
}
