import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/common/queryKeys";
import { inventoryService, type InventoryRoleScope } from "@/services/inventory-management/inventory.service";
import type { InventoryItemPayload, RecipePayload, StockAdjustmentPayload, TransferPayload, WastePayload } from "@/types/inventory-management";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function invalidateInventory(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.inventory.root() });
}

export function useCreateInventoryItemMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, scope = "admin" }: { payload: InventoryItemPayload; scope?: InventoryRoleScope }) => inventoryService.createItem(payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Inventory item created");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create item")),
  });
}

export function useUpdateInventoryItemMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, scope = "admin" }: { id: number | string; payload: Partial<InventoryItemPayload>; scope?: InventoryRoleScope }) => inventoryService.updateItem(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Inventory item updated");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update item")),
  });
}

export function useDeleteInventoryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scope = "admin" }: { id: number | string; scope?: InventoryRoleScope }) => inventoryService.deleteItem(id, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Inventory item deleted");
      invalidateInventory(queryClient);
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete item")),
  });
}

export function useAdjustStockMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, scope = "admin" }: { id: number | string; payload: StockAdjustmentPayload; scope?: InventoryRoleScope }) => inventoryService.adjustItem(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Stock adjusted");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to adjust stock")),
  });
}

export function useRecordWasteMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, scope = "admin" }: { id: number | string; payload: WastePayload; scope?: InventoryRoleScope }) => inventoryService.wasteItem(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Waste recorded");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to record waste")),
  });
}

export function useTransferStockMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, scope = "admin" }: { id: number | string; payload: TransferPayload; scope?: InventoryRoleScope }) => inventoryService.transferItem(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Stock transferred");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to transfer stock")),
  });
}

export function useCreateRecipeMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, scope = "admin" }: { payload: RecipePayload; scope?: InventoryRoleScope }) => inventoryService.createRecipe(payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Recipe saved");
      invalidateInventory(queryClient);
      queryClient.invalidateQueries({ queryKey: ["inventory", "recipes"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "recipe-integrity"] });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to save recipe")),
  });
}

export function useUpdateRecipeMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, scope = "admin" }: { id: number | string; payload: RecipePayload; scope?: InventoryRoleScope }) => inventoryService.updateRecipe(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Recipe updated");
      invalidateInventory(queryClient);
      queryClient.invalidateQueries({ queryKey: ["inventory", "recipes"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "recipe-integrity"] });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update recipe")),
  });
}
