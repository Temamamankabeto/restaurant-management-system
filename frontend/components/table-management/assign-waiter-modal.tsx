"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DiningTable,
  useAssignTableWaiterMutation,
  useTableWaitersQuery,
  useTransferTableMutation,
  useUnassignTableWaiterMutation,
} from "@/hooks/table-management/table";

function waiterDisplayName(waiter: any) {
  return waiter?.name ?? waiter?.full_name ?? waiter?.username ?? waiter?.email ?? `Waiter #${waiter?.id}`;
}

export function AssignWaiterModal({
  open,
  onOpenChange,
  table,
  mode = "assign",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: DiningTable | null;
  mode?: "assign" | "transfer";
}) {
  const { data: waiters = [] } = useTableWaitersQuery();
  const assignMutation = useAssignTableWaiterMutation();
  const unassignMutation = useUnassignTableWaiterMutation();
  const transferMutation = useTransferTableMutation();
  const [selected, setSelected] = useState<Array<number | string>>([]);

  useEffect(() => {
    if (!open) return;

    const currentWaiterId =
      table?.waiter_id ??
      table?.assigned_waiter_id ??
      table?.waiter?.id ??
      table?.assigned_waiter?.id;

    setSelected(currentWaiterId ? [currentWaiterId] : []);
  }, [open, table]);

  function toggle(id: number | string) {
    setSelected((current) => (current.includes(id) ? [] : [id]));
  }

  async function submit() {
    if (!table?.id) return;

    try {
      if (!selected.length) {
        await unassignMutation.mutateAsync(table.id);
        toast.success("Waiter unassigned successfully");
      } else if (mode === "transfer") {
        await transferMutation.mutateAsync({
          id: table.id,
          payload: { to_table_id: selected[0], note: "Waiter transfer from assign waiter modal" },
        });
        toast.success("Table transferred successfully");
      } else {
        await assignMutation.mutateAsync({ id: table.id, waiter_id: selected[0] });
        toast.success("Waiter assigned successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save waiter assignment");
    }
  }

  const pending = assignMutation.isPending || unassignMutation.isPending || transferMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "transfer" ? "Transfer table" : "Assign waiter"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>{table?.table_number ?? table?.number ?? table?.name ?? "Table"} waiter</Label>
          <div className="grid max-h-72 gap-2 overflow-auto rounded-xl border p-3 md:grid-cols-2">
            {waiters.length ? (
              waiters.map((waiter) => (
                <label key={String(waiter.id)} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={selected.includes(waiter.id)} onCheckedChange={() => toggle(waiter.id)} />
                  {waiterDisplayName(waiter)}
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No waiters found.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Select one waiter. Uncheck all and save to unassign.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
