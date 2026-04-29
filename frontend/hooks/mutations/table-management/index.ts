import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/hooks/queryKeys";
import { tableService } from "@/services/table-management";
import type {
  AssignWaitersPayload,
  BulkAssignTablesPayload,
  TablePayload,
  TransferOrdersPayload,
  TransferWaitersPayload,
  UpdateTableStatusPayload,
} from "@/types/table-management";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function invalidateTables(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tables.root() });
}

export function useCreateTableMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TablePayload) => tableService.create(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Table created");
      invalidateTables(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create table")),
  });
}

export function useUpdateTableMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TablePayload }) => tableService.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Table updated");
      invalidateTables(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update table")),
  });
}

export function useAssignTableWaitersMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: AssignWaitersPayload }) =>
      tableService.assignWaiters(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Waiters assigned");
      invalidateTables(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to assign waiters")),
  });
}

export function useTransferTableWaitersMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TransferWaitersPayload }) =>
      tableService.transferWaiters(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Waiters transferred");
      invalidateTables(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to transfer waiters")),
  });
}

export function useTransferTableOrdersMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TransferOrdersPayload }) =>
      tableService.transferOrders(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Orders transferred");
      invalidateTables(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to transfer orders")),
  });
}

export function useUpdateTableStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateTableStatusPayload }) =>
      tableService.updateStatus(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Table status updated");
      invalidateTables(queryClient);
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update table status")),
  });
}

export function useToggleTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => tableService.toggle(id),
    onSuccess: (response) => {
      toast.success(response.message ?? "Table toggled");
      invalidateTables(queryClient);
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to toggle table")),
  });
}

export function useBulkAssignTablesToWaiterMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignTablesPayload) => tableService.bulkAssignTablesToWaiter(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Tables updated");
      invalidateTables(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to bulk assign tables")),
  });
}
