"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAssignTableWaitersMutation, useTransferTableWaitersMutation } from "@/hooks/mutations/table-management";
import { useTableWaitersQuery } from "@/hooks/queries/table-management";
import type { DiningTable } from "@/types/table-management";

export function AssignWaiterModal({ open, onOpenChange, table, mode = "assign" }: { open: boolean; onOpenChange: (open: boolean) => void; table?: DiningTable | null; mode?: "assign" | "transfer" }) {
  const { data: waiters = [] } = useTableWaitersQuery();
  const assignMutation = useAssignTableWaitersMutation(() => onOpenChange(false));
  const transferMutation = useTransferTableWaitersMutation(() => onOpenChange(false));
  const [selected, setSelected] = useState<Array<number | string>>([]);

  useEffect(() => {
    if (!open) return;
    setSelected(mode === "assign" ? table?.waiters?.map((waiter) => waiter.id) ?? [] : []);
  }, [open, mode, table]);

  function toggle(id: number | string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submit() {
    if (!table?.id) return;
    if (mode === "transfer") transferMutation.mutate({ id: table.id, payload: { to_waiter_ids: selected } });
    else assignMutation.mutate({ id: table.id, payload: { waiter_ids: selected } });
  }

  const pending = assignMutation.isPending || transferMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "transfer" ? "Transfer table to waiters" : "Assign waiters"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label>{table?.table_number} waiters</Label>
          <div className="grid max-h-72 gap-2 overflow-auto rounded-xl border p-3 md:grid-cols-2">
            {waiters.length ? waiters.map((waiter) => (
              <label key={waiter.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={selected.includes(waiter.id)} onCheckedChange={() => toggle(waiter.id)} />
                {waiter.name}
              </label>
            )) : <p className="text-sm text-muted-foreground">No waiters found.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending || !selected.length}>{pending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
