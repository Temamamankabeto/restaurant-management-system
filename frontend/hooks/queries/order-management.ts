import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { orderService } from "@/services/order-management";
import type { OrderFilters } from "@/types/order-management";

type OrderScope = "waiter" | "cashier" | "public" | "admin";
type PrepTicketKind = "kitchen" | "bar";

export function useWaitersLiteQuery(search = "") {
  return useQuery({
    queryKey: ["order-management", "waiters-lite", search] as const,
    queryFn: () => orderService.waiters(search),
  });
}

export function useOrdersQuery(filters: OrderFilters = {}, scope: OrderScope = "admin") {
  return useQuery({
    queryKey: queryKeys.orders.list(filters, scope),
    queryFn: () => orderService.orders(filters, scope),
  });
}

export function useOrderQuery(id?: string | number, scope: OrderScope = "admin") {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? "", scope),
    queryFn: () => orderService.order(id as string | number, scope),
    enabled: id !== undefined && id !== null && String(id).length > 0,
  });
}

export function useCreditAccountsQuery(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.credit.accounts(filters),
    queryFn: () => orderService.creditAccounts(filters),
  });
}

export function useCreditOrdersQuery(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.credit.orders(filters),
    queryFn: () => orderService.creditOrders(filters),
  });
}

export function usePrepTicketsQuery(kind: PrepTicketKind = "kitchen", filters: OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.prepTickets.list(kind, filters),
    queryFn: () => orderService.prepTickets(kind, filters),
  });
}

export function usePackagesQuery(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.catering.packages(filters),
    queryFn: () => orderService.packages(filters),
  });
}

export function usePackageQuery(id?: string | number) {
  return useQuery({
    queryKey: queryKeys.catering.package(id ?? ""),
    queryFn: () => orderService.package(id as string | number),
    enabled: id !== undefined && id !== null && String(id).length > 0,
  });
}

export function usePackageOrdersQuery(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.catering.orders(filters),
    queryFn: () => orderService.packageOrders(filters),
  });
}

export function usePackageOrderQuery(id?: string | number) {
  return useQuery({
    queryKey: queryKeys.catering.order(id ?? ""),
    queryFn: () => orderService.packageOrder(id as string | number),
    enabled: id !== undefined && id !== null && String(id).length > 0,
  });
}
