import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/hooks/queryKeys";
import { tableService } from "@/services/table-management";
import type {
  AssignWaitersPayload,
  BulkAssignTablesPayload,
  TableListParams,
  TablePayload,
  TransferOrdersPayload,
  TransferWaitersPayload,
  UpdateTableStatusPayload,
} from "@/types/table-management";

export type TableRoleScope = "admin" | "manager" | "waiter" | "cashier";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function invalidateTables(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tables.root() });
}

export function useTablesQuery(params: TableListParams = {}, roleScope: TableRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.tables.list(params, roleScope),
    queryFn: () => tableService.list(params, roleScope),
  });
}

export function usePublicTablesQuery(params: TableListParams = {}) {
  return useQuery({
    queryKey: queryKeys.tables.public(params),
    queryFn: () => tableService.publicList(params),
  });
}

export function useTableQuery(id?: number | string) {
  return useQuery({
    queryKey: queryKeys.tables.detail(id ?? ""),
    queryFn: () => tableService.show(id as number | string),
    enabled: Boolean(id),
  });
}

export function useTableSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.tables.summary(),
    queryFn: () => tableService.summary(),
  });
}

export function useTableSectionsQuery() {
  return useQuery({
    queryKey: queryKeys.tables.sections(),
    queryFn: () => tableService.sections(),
  });
}

export function useTableHistoryQuery(id?: number | string) {
  return useQuery({
    queryKey: queryKeys.tables.history(id ?? ""),
    queryFn: () => tableService.history(id as number | string),
    enabled: Boolean(id),
  });
}

export function useTableWaitersQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.tables.waiters(search),
    queryFn: () => tableService.waiters(search),
  });
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
