import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys";
import { tableService } from "@/services/table-management";
import type { TableListParams } from "@/types/table-management";

export type TableRoleScope = "admin" | "manager" | "waiter" | "cashier";

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
