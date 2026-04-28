"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToggleTableMutation, useUpdateTableStatusMutation } from "@/mutations/table-management";
import type { DiningTable, TableStatus } from "@/types/table-management";
import { can, tablePermissions } from "@/lib/auth/permissions";

const statuses: TableStatus[] = ["available", "occupied", "reserved", "cleaning"];

type TableActionsDropdownProps = {
  table: DiningTable;
  onEdit: () => void;
  onAssign: () => void;
  onTransfer: () => void;
  onTransferOrders: () => void;
};

export function TableActionsDropdown({
  table,
  onEdit,
  onAssign,
  onTransfer,
  onTransferOrders,
}: TableActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const toggleMutation = useToggleTableMutation();
  const statusMutation = useUpdateTableStatusMutation();

  function closeThenRun(action: () => void) {
    setOpen(false);
    window.setTimeout(action, 0);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open table actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="z-[60] w-56">
        {can(tablePermissions.update) && (
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); closeThenRun(onEdit); }}>
            Edit table
          </DropdownMenuItem>
        )}

        {can(tablePermissions.assign) && (
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); closeThenRun(onAssign); }}>
            Assign waiters
          </DropdownMenuItem>
        )}

        {can(tablePermissions.transfer) && (
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); closeThenRun(onTransfer); }}>
            Transfer waiters
          </DropdownMenuItem>
        )}

        {can(tablePermissions.transfer) && (
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); closeThenRun(onTransferOrders); }}>
            Transfer active orders
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {can(tablePermissions.statusUpdate) && statuses.map((status) => (
          <DropdownMenuItem
            key={status}
            disabled={table.status === status || statusMutation.isPending}
            onSelect={(event) => {
              event.preventDefault();
              setOpen(false);
              statusMutation.mutate({ id: table.id, payload: { status } });
            }}
          >
            Mark {status.replace(/_/g, " ")}
          </DropdownMenuItem>
        ))}

        {can(tablePermissions.toggle) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={toggleMutation.isPending}
              onSelect={(event) => {
                event.preventDefault();
                setOpen(false);
                toggleMutation.mutate(table.id);
              }}
            >
              {table.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
