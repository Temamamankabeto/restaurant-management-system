import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type TableStatus = "available" | "occupied" | "reserved" | "cleaning" | "out_of_service" | string;

export type DiningTable = {
  id: number | string;
  table_number?: string;
  number?: string;
  name?: string;
  section?: string | null;
  capacity?: number | string | null;
  status?: TableStatus;
  is_active?: boolean | number;
  active?: boolean | number;
  waiter_id?: number | string | null;
  assigned_waiter_id?: number | string | null;
  waiter?: {
    id?: number | string;
    name?: string;
    full_name?: string;
    email?: string;
  } | null;
  current_order_id?: number | string | null;
  orders_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type TableFilters = {
  search?: string;
  section?: string;
  status?: string;
  active?: string | number | boolean;
  waiter_id?: string | number;
  page?: number;
  per_page?: number;
};

export type TablePayload = {
  table_number?: string;
  number?: string;
  name?: string;
  section?: string | null;
  capacity?: number | string | null;
  status?: TableStatus;
  is_active?: boolean | number;
};

export type AssignWaiterPayload = {
  waiter_id: number | string;
};

export type TransferTablePayload = {
  to_table_id: number | string;
  note?: string;
};

export type SetTableStatusPayload = {
  status: TableStatus;
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

export type WaiterLite = {
  id: number | string;
  name?: string;
  full_name?: string;
  email?: string;
  [key: string]: unknown;
};

const TABLE_BASE = "/admin/tables";
const USERS_BASE = "/admin/users";

export const tableManagementKeys = {
  all: ["table-management"] as const,
  lists: () => [...tableManagementKeys.all, "list"] as const,
  list: (filters: TableFilters = {}) => [...tableManagementKeys.lists(), filters] as const,
  details: () => [...tableManagementKeys.all, "detail"] as const,
  detail: (id: number | string) => [...tableManagementKeys.details(), id] as const,
  summary: () => [...tableManagementKeys.all, "summary"] as const,
  sections: () => [...tableManagementKeys.all, "sections"] as const,
  history: (id: number | string) => [...tableManagementKeys.detail(id), "history"] as const,
  waiters: () => [...tableManagementKeys.all, "waiters-lite"] as const,
};

function unwrapList<T>(response: any): PaginatedResponse<T> {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return { data: payload };
  }

  if (Array.isArray(payload?.data)) {
    return payload;
  }

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

function cleanFilters(filters: TableFilters = {}) {
  const params: Record<string, unknown> = { ...filters };

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === "" || value === "all") {
      delete params[key];
    }
  });

  return params;
}

export async function getTables(filters: TableFilters = {}) {
  const response = await api.get(TABLE_BASE, { params: cleanFilters(filters) });
  return unwrapList<DiningTable>(response);
}

export async function getTable(id: number | string) {
  const response = await api.get(`${TABLE_BASE}/${id}`);
  return unwrapData<DiningTable>(response);
}

export async function createTable(payload: TablePayload) {
  const response = await api.post(TABLE_BASE, payload);
  return unwrapData<DiningTable>(response);
}

export async function updateTable(id: number | string, payload: TablePayload) {
  const response = await api.put(`${TABLE_BASE}/${id}`, payload);
  return unwrapData<DiningTable>(response);
}

export async function assignTableWaiter(id: number | string, payload: AssignWaiterPayload) {
  const response = await api.post(`${TABLE_BASE}/${id}/assign`, payload);
  return unwrapData<DiningTable>(response);
}

export async function unassignTableWaiter(id: number | string) {
  const response = await api.delete(`${TABLE_BASE}/${id}/assign`);
  return unwrapData<DiningTable>(response);
}

export async function transferTable(id: number | string, payload: TransferTablePayload) {
  const response = await api.post(`${TABLE_BASE}/${id}/transfer`, payload);
  return unwrapData<DiningTable>(response);
}

export async function transferTableOrders(id: number | string, payload: TransferTablePayload) {
  const response = await api.post(`${TABLE_BASE}/${id}/transfer-orders`, payload);
  return unwrapData<DiningTable>(response);
}

export async function setTableStatus(id: number | string, payload: SetTableStatusPayload) {
  const response = await api.patch(`${TABLE_BASE}/${id}/status`, payload);
  return unwrapData<DiningTable>(response);
}

export async function toggleTableActive(id: number | string) {
  const response = await api.patch(`${TABLE_BASE}/${id}/toggle`);
  return unwrapData<DiningTable>(response);
}

export async function getTableSummary() {
  const response = await api.get("/admin/tables-summary");
  return unwrapData<TableSummary>(response);
}

export async function getTableSections() {
  const response = await api.get("/admin/tables-sections");
  const data = unwrapData<any>(response);
  if (Array.isArray(data)) return data as string[];
  if (Array.isArray(data?.sections)) return data.sections as string[];
  return [];
}

export async function getTableHistory(id: number | string) {
  const response = await api.get(`${TABLE_BASE}/${id}/history`);
  return unwrapList<Record<string, unknown>>(response);
}

export async function getWaitersLite() {
  const response = await api.get(`${USERS_BASE}/waiters-lite`);
  return unwrapList<WaiterLite>(response).data;
}

export function useTablesQuery(filters: TableFilters = {}) {
  return useQuery({
    queryKey: tableManagementKeys.list(filters),
    queryFn: () => getTables(filters),
  });
}

export function useTableQuery(id?: number | string) {
  return useQuery({
    queryKey: id ? tableManagementKeys.detail(id) : [...tableManagementKeys.details(), "empty"],
    queryFn: () => getTable(id as number | string),
    enabled: Boolean(id),
  });
}

export function useTableSummaryQuery() {
  return useQuery({
    queryKey: tableManagementKeys.summary(),
    queryFn: getTableSummary,
  });
}

export function useTableSectionsQuery() {
  return useQuery({
    queryKey: tableManagementKeys.sections(),
    queryFn: getTableSections,
  });
}

export function useTableHistoryQuery(id?: number | string) {
  return useQuery({
    queryKey: id ? tableManagementKeys.history(id) : [...tableManagementKeys.details(), "history-empty"],
    queryFn: () => getTableHistory(id as number | string),
    enabled: Boolean(id),
  });
}

export function useTableWaitersQuery() {
  return useQuery({
    queryKey: tableManagementKeys.waiters(),
    queryFn: getWaitersLite,
  });
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

export function useCreateTableMutation() {
  const invalidate = useInvalidateTables();
  return useMutation({ mutationFn: createTable, onSuccess: invalidate });
}

export function useUpdateTableMutation() {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TablePayload }) => updateTable(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(variables.id) });
    },
  });
}

export function useAssignTableWaiterMutation() {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, waiter_id }: { id: number | string; waiter_id: number | string }) =>
      assignTableWaiter(id, { waiter_id }),
    onSuccess: async (_data, variables) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(variables.id) });
    },
  });
}

export function useUnassignTableWaiterMutation() {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => unassignTableWaiter(id),
    onSuccess: async (_data, id) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(id) });
    },
  });
}

export function useTransferTableMutation() {
  const invalidate = useInvalidateTables();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TransferTablePayload }) => transferTable(id, payload),
    onSuccess: invalidate,
  });
}

export function useTransferTableOrdersMutation() {
  const invalidate = useInvalidateTables();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TransferTablePayload }) => transferTableOrders(id, payload),
    onSuccess: invalidate,
  });
}

export function useSetTableStatusMutation() {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: TableStatus }) => setTableStatus(id, { status }),
    onSuccess: async (_data, variables) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(variables.id) });
    },
  });
}

export function useToggleTableActiveMutation() {
  const invalidate = useInvalidateTables();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => toggleTableActive(id),
    onSuccess: async (_data, id) => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: tableManagementKeys.detail(id) });
    },
  });
}
