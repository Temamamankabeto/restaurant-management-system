"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBulkAssignTablesToWaiterMutation } from "@/mutations/table-management";
import { useTablesQuery, useTableWaitersQuery } from "@/queries/table-management";
import type { DiningTable } from "@/types/table-management";

function tableLabel(table: DiningTable) {
  return [table.table_number, table.name, table.section ? `(${table.section})` : null].filter(Boolean).join(" ");
}

function idKey(id: number | string) {
  return String(id);
}

export function BulkAssignTablesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: apiWaiters = [], isLoading: waitersLoading } = useTableWaitersQuery();
  const tablesQuery = useTablesQuery({ page: 1, per_page: 500, is_active: "all", status: "all", section: "all" });
  const bulkAssignMutation = useBulkAssignTablesToWaiterMutation(() => onOpenChange(false));
  const [waiterId, setWaiterId] = useState<string>("");
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const tables = tablesQuery.data?.data ?? [];

  const originallyAssignedTableIds = useMemo(() => {
    if (!waiterId) return [];
    return tables
      .filter((table) => table.waiters?.some((waiter) => idKey(waiter.id) === idKey(waiterId)))
      .map((table) => idKey(table.id));
  }, [waiterId, tables]);

  useEffect(() => {
    if (!open) return;
    setWaiterId("");
    setSelectedTableIds([]);
    setSearch("");
  }, [open]);

  const waiters = useMemo(() => {
    const map = new Map<string, { id: number | string; name: string; email?: string | null }>();

    apiWaiters.forEach((waiter) => {
      if (waiter?.id) map.set(idKey(waiter.id), waiter);
    });

    tables.forEach((table) => {
      table.waiters?.forEach((waiter) => {
        if (waiter?.id && !map.has(idKey(waiter.id))) {
          map.set(idKey(waiter.id), waiter);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [apiWaiters, tables]);

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tables;
    return tables.filter((table) => tableLabel(table).toLowerCase().includes(term));
  }, [search, tables]);

  function handleWaiterChange(value: string) {
    setWaiterId(value);
    const assigned = tables
      .filter((table) => table.waiters?.some((waiter) => idKey(waiter.id) === idKey(value)))
      .map((table) => idKey(table.id));
    setSelectedTableIds(assigned);
  }

  function toggleTable(id: number | string, checked: boolean) {
    const key = idKey(id);
    setSelectedTableIds((current) => {
      if (checked) return current.includes(key) ? current : [...current, key];
      return current.filter((item) => item !== key);
    });
  }

  function toggleAllVisible(checked: boolean) {
    const visibleIds = filteredTables.map((table) => idKey(table.id));
    setSelectedTableIds((current) => {
      if (!checked) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function submit() {
    if (!waiterId) return;

    const removeTableIds = originallyAssignedTableIds.filter((id) => !selectedTableIds.includes(id));

    if (selectedTableIds.length === 0 && removeTableIds.length === 0) return;

    bulkAssignMutation.mutate({
      waiter_id: waiterId,
      table_ids: selectedTableIds,
      remove_table_ids: removeTableIds,
    });
  }

  const allVisibleSelected = filteredTables.length > 0 && filteredTables.every((table) => selectedTableIds.includes(idKey(table.id)));
  const pending = bulkAssignMutation.isPending;
  const removeCount = originallyAssignedTableIds.filter((id) => !selectedTableIds.includes(id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign multiple tables to waiter</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Waiter</Label>
              {waiterId ? <span className="text-xs text-muted-foreground">1 selected</span> : null}
            </div>

            {waitersLoading && !waiters.length ? (
              <div className="rounded-xl border p-3 text-sm text-muted-foreground">Loading waiters...</div>
            ) : waiters.length ? (
              <Select value={waiterId} onValueChange={handleWaiterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select waiter" />
                </SelectTrigger>
                <SelectContent>
                  {waiters.map((waiter) => (
                    <SelectItem key={idKey(waiter.id)} value={idKey(waiter.id)}>
                      {waiter.name}{waiter.email ? ` — ${waiter.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2 rounded-xl border p-3 text-sm text-muted-foreground">
                <p>No waiter users found from the waiter endpoint.</p>
                <p>Create/assign a user with role name <span className="font-medium text-foreground">Waiter</span>, or use the existing single-table assignment until the waiter endpoint returns users.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Tables</Label>
              <span className="text-xs text-muted-foreground">
                {selectedTableIds.length} selected{removeCount ? `, ${removeCount} will be removed` : ""}
              </span>
            </div>
            <Input placeholder="Search table, name, or section..." value={search} onChange={(event) => setSearch(event.target.value)} />
            {waiterId ? (
              <p className="text-xs text-muted-foreground">Checked tables will be assigned to this waiter. Unchecked previously assigned tables will be removed after saving.</p>
            ) : null}
            <div className="rounded-xl border">
              <label className="flex items-center gap-2 border-b p-3 text-sm font-medium">
                <Checkbox checked={allVisibleSelected} onCheckedChange={(value) => toggleAllVisible(Boolean(value))} />
                Select all visible tables
              </label>
              <div className="grid max-h-80 gap-2 overflow-auto p-3 md:grid-cols-2">
                {tablesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading tables...</p>
                ) : filteredTables.length ? filteredTables.map((table) => {
                  const tableId = idKey(table.id);
                  return (
                    <label key={tableId} className="flex items-start gap-2 rounded-lg p-2 text-sm hover:bg-muted/60">
                      <Checkbox checked={selectedTableIds.includes(tableId)} onCheckedChange={(value) => toggleTable(table.id, Boolean(value))} />
                      <span>
                        <span className="font-medium">{tableLabel(table)}</span>
                        <span className="block text-xs text-muted-foreground">Current waiters: {table.waiters?.length ? table.waiters.map((waiter) => waiter.name).join(", ") : "—"}</span>
                      </span>
                    </label>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground">No tables found.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={!waiterId || (selectedTableIds.length === 0 && removeCount === 0) || pending} onClick={submit}>
            {pending ? "Saving..." : "Save waiter tables"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
