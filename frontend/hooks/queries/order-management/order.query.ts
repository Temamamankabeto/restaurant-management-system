import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/common/queryKeys';
import { orderService } from '@/services/order-management';
import type { OrderFilters } from '@/types/order-management';

export function useWaitersLiteQuery(search = '') { return useQuery({ queryKey: ['orders', 'waiters-lite', search], queryFn: () => orderService.waiters(search) }); }
export function useOrdersQuery(params: OrderFilters = {}, scope: 'waiter'|'cashier'|'public'|'admin' = 'admin') { return useQuery({ queryKey: queryKeys.orders.list(params, scope), queryFn: () => orderService.orders(params, scope) }); }
export function useOrderQuery(id?: string|number, scope: 'waiter'|'cashier'|'public'|'admin' = 'admin') { return useQuery({ queryKey: queryKeys.orders.detail(id ?? 'new', scope), queryFn: () => orderService.order(id!, scope), enabled: !!id }); }
export function useCreditAccountsQuery(params: OrderFilters = {}) { return useQuery({ queryKey: queryKeys.credit.accounts(params), queryFn: () => orderService.creditAccounts(params) }); }
export function useCreditOrdersQuery(params: OrderFilters = {}) { return useQuery({ queryKey: queryKeys.credit.orders(params), queryFn: () => orderService.creditOrders(params) }); }
export function usePackagesQuery(params: OrderFilters = {}) { return useQuery({ queryKey: queryKeys.catering.packages(params), queryFn: () => orderService.packages(params) }); }
export function usePackageQuery(id?: string|number) { return useQuery({ queryKey: queryKeys.catering.package(id ?? 'new'), queryFn: () => orderService.package(id!), enabled: !!id }); }
export function usePackageOrdersQuery(params: OrderFilters = {}) { return useQuery({ queryKey: queryKeys.catering.orders(params), queryFn: () => orderService.packageOrders(params) }); }
export function usePackageOrderQuery(id?: string|number) { return useQuery({ queryKey: queryKeys.catering.order(id ?? 'new'), queryFn: () => orderService.packageOrder(id!), enabled: !!id }); }

export function usePrepTicketsQuery(kind: 'kitchen'|'bar', params: OrderFilters = {}) { return useQuery({ queryKey: queryKeys.prepTickets.list(kind, params), queryFn: () => orderService.prepTickets(kind, params) }); }
