import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/common/queryKeys";
import { inventoryService, type InventoryRoleScope } from "@/services/inventory-management/inventory.service";
import type { InventoryListParams } from "@/types/inventory-management";

export function useInventoryItemsQuery(params: InventoryListParams = {}, roleScope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.items(params, roleScope),
    queryFn: () => inventoryService.items(params, roleScope),
  });
}

export function useInventoryTransactionsQuery(params: InventoryListParams & { type?: string; inventory_item_id?: number | string } = {}, roleScope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.transactions(params, roleScope),
    queryFn: () => inventoryService.transactions(params, roleScope),
  });
}

export function useInventoryBatchesQuery(params: InventoryListParams & { inventory_item_id?: number | string } = {}, roleScope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.batches(params, roleScope),
    queryFn: () => inventoryService.batches(params, roleScope),
    retry: false,
  });
}

export function useMenuItemsQuery(params: InventoryListParams & { type?: string; is_active?: boolean; is_available?: boolean } = {}, roleScope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.menuItems(params, roleScope),
    queryFn: () => inventoryService.menuItems(params, roleScope),
  });
}

export function useRecipesQuery(params: InventoryListParams = {}, roleScope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.recipes(params, roleScope),
    queryFn: () => inventoryService.recipes(params, roleScope),
  });
}

export function useLowStockQuery(roleScope: InventoryRoleScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.lowStock(roleScope),
    queryFn: () => inventoryService.lowStock(roleScope),
    retry: false,
  });
}

export function useStockValuationQuery(roleScope: InventoryRoleScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.valuation(roleScope),
    queryFn: () => inventoryService.stockValuation(roleScope),
    retry: false,
  });
}

export function useRecipeIntegrityQuery(roleScope: InventoryRoleScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.recipeIntegrity(roleScope),
    queryFn: () => inventoryService.recipeIntegrity(roleScope),
    retry: false,
  });
}

export function useStockStatusSummaryQuery(roleScope: InventoryRoleScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.summary(roleScope),
    queryFn: () => inventoryService.stockStatusSummary(roleScope),
    retry: false,
  });
}
