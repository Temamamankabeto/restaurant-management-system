import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type TableStatus = "available" | "occupied" | "reserved" | "cleaning" | "out_of_service" | string;

export type WaiterLite = {
  id: number | string;
  name?: string;
  full_name?: string;
  email?: string | null;
  [key: string]: unknown;
};

export type DiningTable = {
  id: number | string;
  table_number?: string;
  number?: string;
  name?: string | null;
  section?: string | null;
  capacity?: number | string | null;
  status?: TableStatus;
  is_active?: boolean | number;
  active?: boolean | number;
  is_public?: boolean | number;
  sort_order?: number | string;
  waiter_id?: number | string | null;
  assigned_waiter_id?: number | string | null;
  waiter?: WaiterLite | null;
  waiters?: WaiterLite[];
  current_order_id?: number | string | null;
  orders_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type TableListParams = {
  search?: string;
  section?: string;
  status?: string;
  active?: string | number | boolean;
  is_active?: string | number | boolean;
  waiter_id?: string | number;
  page?: number;
  per_page?: number;
};

export type TableFilters = TableListParams;

export type TablePayload = {
  table_number?: string;
  number?: string;
  name?: string | null;
  section?: string | null;
  capacity?: number | string | null;
  status?: TableStatus;
  is_active?: boolean | number;
  is_public?: boolean | number;
  sort_order?: number | string;
  waiter_id?: number | string | null;
  waiter_ids?: Array<number | string>;
};

export type AssignWaiterPayload = { waiter_id: number | string };
export type AssignWaitersPayload = { waiter_ids: Array<number | string> };
export type TransferTablePayload = { to_table_id: number | string; note?: string };
export type TransferOrdersPayload = TransferTablePayload;
export type TransferWaitersPayload = { to_waiter_ids: Array<number | string> };
export type UpdateTableStatusPayload = { status: TableStatus };
export type BulkAssignTablesPayload = {
  waiter_id: number | string;
  table_ids: Array<number | string>;
  remove_table_ids?: Array<number | string>;
};

export type PaginatedResponse<T> = {
  success?: boolean;
  data: T[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
    [key: string]: unknown;
  };
  links?: Record<string, unknown>;
  message?: string;
  [key: string]: unknown;
};

export type TableSummary = {
  total?: number;
  active?: number;
  inactive?: number;
  available?: number;
  occupied?: number;
  reserved?: number;
  cleaning?: number;
  out_of_service?: number;
  by_status?: Record<string, number>;
  [key: string]: unknown;
};

export type TableRoleScope = "admin" | "manager" | "waiter" | "cashier";

const TABLE_BASE = "/admin/tables";
const USERS_BASE = "/admin/users";

export const tableManagementKeys = {
  all: ["table-management"] as const,
  lists: () => [...tableManagementKeys.all, "list"] as const,
  list: (filters: TableListParams = {}, roleScope: TableRoleScope = "admin") => [...tableManagementKeys.lists(), roleScope, filters] as const,
  publicList: (filters: TableListParams = {}) => [...tableManagementKeys.all, "public", filters] as const,
  details: () => [...tableManagementKeys.all, "detail"] as const,
  detail: (id: number | string) => [...tableManagementKeys.details(), id] as const,
  summary: () => [...tableManagementKeys.all, "summary"] as const,
  sections: () => [...tableManagementKeys.all, "sections"] as const,
  history: (id: number | string) => [...tableManagementKeys.detail(id), "history"] as const,
  waiters: (search?: string) => [...tableManagementKeys.all, "waiters-lite", search ?? ""] as const,
};

function unwrapList<T>(response: any): PaginatedResponse<T> {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return { data: payload };
  if (Array.isArray(payload?.data)) return payload;
  if (Array.isArray(payload?.data?.data)) {
    return {
      ...payload.data,
      data: payload.data.data,
      meta: payload.data.meta ?? payload.meta,
    };
  }

  return {
    ...payload,
    data: [],
    meta: payload?.meta ?? payload?.data?.meta,
  };
}

function unwrapData<T>(response: any): T {
  const payload = response?.data ?? response;
  return (payload?.data ?? payload) as T;
}

function cleanFilters(filters: TableListParams = {}) {
  const params: Record<string, unknown> = { ...filters };

  if (params.is_active !== undefined && params.active === undefined) {
    params.active = params.is_active;
    delete params.is_active;
  }

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === "" || value === "all") delete params[key];
  });

  return params;
}

async function listTables(filters: TableListParams = {}) {
  const response = await api.get(TABLE_BASE, { params: cleanFilters(filters) });
  return unwrapList<DiningTable>(response);
}

async function showTable(id: number | string) {
  const response = await api.get(`${TABLE_BASE}/${id}`);
  return unwrapData<DiningTable>(response);
}

async function createTable(payload: TablePayload) {
  const response = await api.post(TABLE_BASE, payload);
  return unwrapData<any>(response);
}

async function updateTable(id: number | string, payload: TablePayload) {
  const response = await api.put(`${TABLE_BASE}/${id}`, payload);
  return unwrapData<any>(response);
}

async function assignTableWaiter(id: number | string, payload: AssignWaiterPayload) {
  const response = await api.post(`${TABLE_BASE}/${id}/assign`, payload);
  return unwrapData<any>(response);
}

async function unassignTableWaiter(id: number | string) {
  const response = await api.delete(`${TABLE_BASE}/${id}/assign`);
  return unwrapData<any>(response);
}

async function transferTable(id: number | string, payload: TransferTablePayload) {
  const response = await api.post(`${TABLE_BASE}/${id}/transfer`, payload);
  return unwrapData<any>(response);
}

async function transferTableOrders(id: number | string, payload: TransferOrdersPayload) {
  const response = await api.post(`${TABLE_BASE}/${id}/transfer-orders`, payload);
  return unwrapData<any>(response);
}

async function setTableStatus(id: number | string, payload: UpdateTableStatusPayload) {
  const response = await api.patch(`${TABLE_BASE}/${id}/status`, payload);
  return unwrapData<any>(response);
}

async function toggleTableActive(id: number | string) {
  const response = await api.patch(`${TABLE_BASE}/${id}/toggle`);
  return unwrapData<any>(response);
}

async function getTableSummary() {
  const response = await api.get("/admin/tables-summary");
  return unwrapData<TableSummary>(response);
}

async function getTableSections() {
  const response = await api.get("/admin/tables-sections");
  const data = unwrapData<any>(response);
  if (Array.isArray(data)) return data as string[];
  if (Array.isArray(data?.sections)) return data.sections as string[];
  return [];
}

async function getTableHistory(id: number | string) {
  const response = await api.get(`${TABLE_BASE}/${id}/history`);
  return unwrapList<Record<string, unknown>>(response);
}

async function getWaitersLite(search?: string) {
  const response = await api.get(`${USERS_BASE}/waiters-lite`, { params: search ? { search } : undefined });
  return unwrapList<WaiterLite>(response).data;
}

export function useTablesQuery(params: TableListParams = {}, roleScope: TableRoleScope = "admin") {
  return useQuery({
    queryKey: tableManagementKeys.list(params, roleScope),
    queryFn: () => listTables(params),
  });
}

export function usePublicTablesQuery(params: TableListParams = {}) {
  return useQuery({
    queryKey: tableManagementKeys.publicList(params),
    queryFn: () => listTables(params),
  });
}

export function useTableQuery(id?: number | string) {
  return useQuery({
    queryKey: id ? tableManagementKeys.detail(id) : [...tableManagementKeys.details(), "empty"],
    queryFn: () => showTable(id as number | string),
    enabled: Boolean(id),
  });
}

export function useTableSummaryQuery() {
  return useQuery({ queryKey: tableManagementKeys.summary(), queryFn: getTableSummary });
}

export function useTableSectionsQuery() {
  return useQuery({ queryKey: tableManagementKeys.sections(), queryFn: getTableSections });
}

export function useTableHistoryQuery(id?: number | string) {
  return useQuery({
    queryKey: id ? tableManagementKeys.history(id) : [...tableManagementKeys.details(), "history-empty"],
    queryFn: () => getTableHistory(id as number | string),
    enabled: Boolean(id),
  });
}

export function useTableWaitersQuery(search?: string) {
  return useQuery({ queryKey: tableManagementKeys.waiters(search), queryFn: () => getWaitersLite(search) });
}

function useInvalidateTables() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tableManagementKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: tableManagementKeys.summary() }),
      queryClient.invalidateQueries({ queryKey: tableManagementKeys.sections() }),
    ]);
  };
}

export function useCreateTableMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  return useMutation({
    mutationFn: createTable,
    onSuccess: async () => {
      await invalidate();
      onSuccess?.();
    },
  });
}

export function useUpdateTableMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TablePayload }) => updateTable(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(variables.id) });
      onSuccess?.();
    },
  });
}

export function useAssignTableWaiterMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, waiter_id }: { id: number | string; waiter_id: number | string }) => assignTableWaiter(id, { waiter_id }),
    onSuccess: async (_data, variables) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(variables.id) });
      onSuccess?.();
    },
  });
}

export function useAssignTableWaitersMutation(onSuccess?: () => void) {
  const singleAssign = useAssignTableWaiterMutation(onSuccess);
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number | string; payload: AssignWaitersPayload }) => {
      const firstWaiterId = payload.waiter_ids?.[0];
      if (!firstWaiterId) return unassignTableWaiter(id);
      return assignTableWaiter(id, { waiter_id: firstWaiterId });
    },
    onSuccess: singleAssign.options?.onSuccess as any,
  });
}

export function useUnassignTableWaiterMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => unassignTableWaiter(id),
    onSuccess: async (_data, id) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(id) });
      onSuccess?.();
    },
  });
}

export function useTransferTableMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TransferTablePayload }) => transferTable(id, payload),
    onSuccess: async () => {
      await invalidate();
      onSuccess?.();
    },
  });
}

export function useTransferTableWaitersMutation(onSuccess?: () => void) {
  return useTransferTableMutation(onSuccess);
}

export function useTransferTableOrdersMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TransferOrdersPayload }) => transferTableOrders(id, payload),
    onSuccess: async () => {
      await invalidate();
      onSuccess?.();
    },
  });
}

export function useSetTableStatusMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: TableStatus }) => setTableStatus(id, { status }),
    onSuccess: async (_data, variables) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(variables.id) });
      onSuccess?.();
    },
  });
}

export function useUpdateTableStatusMutation(onSuccess?: () => void) {
  const mutation = useSetTableStatusMutation(onSuccess);
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateTableStatusPayload }) => setTableStatus(id, payload),
    onSuccess: mutation.options?.onSuccess as any,
  });
}

export function useToggleTableActiveMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => toggleTableActive(id),
    onSuccess: async (_data, id) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(id) });
      onSuccess?.();
    },
  });
}

export function useToggleTableMutation(onSuccess?: () => void) {
  return useToggleTableActiveMutation(onSuccess);
}

export function useBulkAssignTablesToWaiterMutation(onSuccess?: () => void) {
  const invalidate = useInvalidateTables();
  return useMutation({
    mutationFn: async (payload: BulkAssignTablesPayload) => {
      for (const tableId of payload.table_ids ?? []) {
        await assignTableWaiter(tableId, { waiter_id: payload.waiter_id });
      }
      for (const tableId of payload.remove_table_ids ?? []) {
        await unassignTableWaiter(tableId);
      }
      return { success: true };
    },
    onSuccess: async () => {
      await invalidate();
      onSuccess?.();
    },
  });
}
