import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/common/queryKeys";
import { menuService } from "@/services/menu-management";
import type { MenuCategoryPayload, MenuItemPayload } from "@/types/menu-management";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function invalidateMenu(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.menu.root() });
}

export function useCreateMenuCategoryMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MenuCategoryPayload) => menuService.createCategory(payload),
    onSuccess: (response) => { toast.success(response.message ?? "Category created"); invalidateMenu(queryClient); onSuccess?.(); },
    onError: (error) => toast.error(errorMessage(error, "Failed to create category")),
  });
}

export function useUpdateMenuCategoryMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: MenuCategoryPayload }) => menuService.updateCategory(id, payload),
    onSuccess: (response) => { toast.success(response.message ?? "Category updated"); invalidateMenu(queryClient); onSuccess?.(); },
    onError: (error) => toast.error(errorMessage(error, "Failed to update category")),
  });
}

export function useToggleMenuCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => menuService.toggleCategory(id),
    onSuccess: (response) => { toast.success(response.message ?? "Category status updated"); invalidateMenu(queryClient); },
    onError: (error) => toast.error(errorMessage(error, "Failed to update category status")),
  });
}

export function useDeleteMenuCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => menuService.deleteCategory(id),
    onSuccess: (response) => { toast.success(response.message ?? "Category deleted"); invalidateMenu(queryClient); },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete category")),
  });
}

export function useCreateMenuItemMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MenuItemPayload) => menuService.createItem(payload),
    onSuccess: (response) => { toast.success(response.message ?? "Menu item created"); invalidateMenu(queryClient); onSuccess?.(); },
    onError: (error) => toast.error(errorMessage(error, "Failed to create menu item")),
  });
}

export function useUpdateMenuItemMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: MenuItemPayload }) => menuService.updateItem(id, payload),
    onSuccess: (response) => { toast.success(response.message ?? "Menu item updated"); invalidateMenu(queryClient); onSuccess?.(); },
    onError: (error) => toast.error(errorMessage(error, "Failed to update menu item")),
  });
}

export function useToggleMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => menuService.toggleItem(id),
    onSuccess: (response) => { toast.success(response.message ?? "Menu item status updated"); invalidateMenu(queryClient); },
    onError: (error) => toast.error(errorMessage(error, "Failed to update menu item status")),
  });
}

export function useMenuItemAvailabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: number | string; isAvailable: boolean }) => menuService.availability(id, isAvailable),
    onSuccess: (response) => { toast.success(response.message ?? "Availability updated"); invalidateMenu(queryClient); },
    onError: (error) => toast.error(errorMessage(error, "Failed to update availability")),
  });
}

export function useSetMenuItemModeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mode }: { id: number | string; mode: "normal" | "spatial" }) => mode === "spatial" ? menuService.spatial(id) : menuService.normal(id),
    onSuccess: (response) => { toast.success(response.message ?? "Menu mode updated"); invalidateMenu(queryClient); },
    onError: (error) => toast.error(errorMessage(error, "Failed to update menu mode")),
  });
}

export function useDeleteMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => menuService.deleteItem(id),
    onSuccess: (response) => { toast.success(response.message ?? "Menu item deleted"); invalidateMenu(queryClient); },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete menu item")),
  });
}
