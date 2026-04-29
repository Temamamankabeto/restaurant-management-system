"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DiningTable,
  useAssignTableWaiterMutation,
  useTableWaitersQuery,
  useTablesQuery,
  useUnassignTableWaiterMutation,
} from "@/hook/table-management/table";

function tableLabel(table: DiningTable) {
  return [table.table_number ?? table.number, table.name, table.section ? `(${table.section})` : null]
    .filter(Boolean)
    .join(" ");
}

function idKey(id: number | string) {
  return String(id);
}

function assignedWaiterId(table: DiningTable) {
  return table.waiter_id ?? table.assigned_waiter_id ?? table.waiter?.id ?? null;
}

export function BulkAssignTablesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: waiters = [], isLoading: waitersLoading } = useTableWaitersQuery();
  const tablesQuery = useTablesQuery({ page: 1, per_page: 500, active: "all", status: "all", section: "all" });
  const assignMutation = useAssignTableWaiterMutation();
  const unassignMutation = useUnassignTableWaiterMutation();

  const [waiterId, setWaiterId] = useState<string>("");
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const tables = tablesQuery.data?.data ?? [];

  const originallyAssignedTableIds = useMemo(() => {
    if (!waiterId) return [];
    return tables
      .filter((table) => idKey(assignedWaiterId(table) ?? "") === idKey(waiterId))
      .map((table) => idKey(table.id));
  }, [waiterId, tables]);

  useEffect(() => {
    if (!open) return;
    setWaiterId("");
    setSelectedTableIds([]);
    setSearch("");
  }, [open]);

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tables;
    return tables.filter((table) => tableLabel(table).toLowerCase().includes(term));
  }, [search, tables]);

  function handleWaiterChange(value: string) {
    setWaiterId(value);
    const assigned = tables
      .filter((table) => idKey(assignedWaiterId(table) ?? "") === idKey(value))
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

  async function submit() {
    if (!waiterId) return;

    const addTableIds = selectedTableIds.filter((id) => !originallyAssignedTableIds.includes(id));
    const removeTableIds = originallyAssignedTableIds.filter((id) => !selectedTableIds.includes(id));

    if (addTableIds.length === 0 && removeTableIds.length === 0) return;

    try {
      for (const tableId of addTableIds) {
        await assignMutation.mutateAsync({ id: tableId, waiter_id: waiterId });
      }

      for (const tableId of removeTableIds) {
        await unassignMutation.mutateAsync(tableId);
      }

      toast.success("Waiter table assignments updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update waiter tables");
    }
  }

  const allVisibleSelected = filteredTables.length > 0 && filteredTables.every((table) => selectedTableIds.includes(idKey(table.id)));
  const pending = assignMutation.isPending || unassignMutation.isPending;
  const removeCount = originallyAssignedTableIds.filter((id) => !selectedTableIds.includes(id)).length;
  const addCount = selectedTableIds.filter((id) => !originallyAssignedTableIds.includes(id)).length;

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
                      {waiter.name ?? waiter.full_name ?? waiter.email ?? `Waiter #${waiter.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2 rounded-xl border p-3 text-sm text-muted-foreground">
                <p>No waiter users found from the waiter endpoint.</p>
                <p>Create or assign a user with role name <span className="font-medium text-foreground">Waiter</span>.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Tables</Label>
              <span className="text-xs text-muted-foreground">
                {selectedTableIds.length} selected{addCount ? `, ${addCount} new` : ""}{removeCount ? `, ${removeCount} removed` : ""}
              </span>
            </div>
            <Input placeholder="Search table, name, or section..." value={search} onChange={(event) => setSearch(event.target.value)} />
            {waiterId ? (
              <p className="text-xs text-muted-foreground">Checked tables will be assigned to this waiter. Unchecked previously assigned tables will be unassigned after saving.</p>
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
                  const currentWaiter = table.waiter?.name ?? table.waiter?.full_name ?? table.waiter?.email ?? "—";
                  return (
                    <label key={tableId} className="flex items-start gap-2 rounded-lg p-2 text-sm hover:bg-muted/60">
                      <Checkbox checked={selectedTableIds.includes(tableId)} onCheckedChange={(value) => toggleTable(table.id, Boolean(value))} />
                      <span>
                        <span className="font-medium">{tableLabel(table)}</span>
                        <span className="block text-xs text-muted-foreground">Current waiter: {currentWaiter}</span>
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
          <Button type="button" disabled={!waiterId || (addCount === 0 && removeCount === 0) || pending} onClick={submit}>
            {pending ? "Saving..." : "Save waiter tables"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
