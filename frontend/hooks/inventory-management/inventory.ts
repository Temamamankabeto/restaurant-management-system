import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory-management/inventory.service";
import { queryKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";

export function useInventoryItemsQuery(params = {}, scope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.items(params, scope),
    queryFn: () => inventoryService.items(params, scope),
  });
}

export function useCreateInventoryItemMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: inventoryService.createItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory.root() });
      toast.success("Inventory item created");
      done?.();
    },
  });
}