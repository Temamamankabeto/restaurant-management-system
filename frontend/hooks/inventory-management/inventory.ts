import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory-management/inventory.service";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  InventoryItemPayload,
  RecipePayload,
  StockAdjustmentPayload,
  TransferPayload,
  WastePayload,
} from "@/types/inventory-management";
import { toast } from "sonner";

export function useInventoryItemsQuery(params = {}, scope: "admin" | "food-controller" | "stock-keeper" = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.items(params, scope),
    queryFn: () => inventoryService.items(params, scope),
  });
}

export function useInventoryTransactionsQuery(params = {}, scope: "admin" | "food-controller" | "stock-keeper" = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.transactions(params, scope),
    queryFn: () => inventoryService.transactions(params, scope),
  });
}

export function useInventoryBatchesQuery(params = {}, scope: "admin" | "food-controller" | "stock-keeper" = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.batches(params, scope),
    queryFn: () => inventoryService.batches(params, scope),
  });
}

export function useCreateInventoryItemMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: InventoryItemPayload) => inventoryService.createItem(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.root() });
      toast.success("Inventory item created");
      done?.();
    },
  });
}

export function useUpdateInventoryItemMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Partial<InventoryItemPayload> }) =>
      inventoryService.updateItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.root() });
      toast.success("Inventory item updated");
      done?.();
    },
  });
}

export function useDeleteInventoryItemMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => inventoryService.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.root() });
      toast.success("Inventory item deleted");
    },
  });
}

export function useAdjustStockMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: StockAdjustmentPayload }) =>
      inventoryService.adjustItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.root() });
      toast.success("Stock adjusted");
      done?.();
    },
  });
}

export function useRecordWasteMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: WastePayload }) =>
      inventoryService.wasteItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.root() });
      toast.success("Waste recorded");
      done?.();
    },
  });
}

export function useTransferStockMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: TransferPayload }) =>
      inventoryService.transferItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.root() });
      toast.success("Stock transferred");
      done?.();
    },
  });
}

export function useCreateRecipeMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: RecipePayload) => inventoryService.createRecipe(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.recipes() });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.recipeIntegrity() });
      toast.success("Recipe saved");
      done?.();
    },
  });
}

export function useUpdateRecipeMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: RecipePayload }) =>
      inventoryService.updateRecipe(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.recipes() });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.recipeIntegrity() });
      toast.success("Recipe updated");
      done?.();
    },
  });
}
