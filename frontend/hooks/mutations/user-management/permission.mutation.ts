import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/common/queryKeys";
import { permissionService } from "@/services/user-management/permission.service";
import type { PermissionPayload } from "@/types/user-management/user.type";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useCreatePermissionMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PermissionPayload) => permissionService.create(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Permission created");
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create permission")),
  });
}

export function useUpdatePermissionMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: PermissionPayload }) => permissionService.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Permission updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update permission")),
  });
}

export function useDeletePermissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => permissionService.remove(id),
    onSuccess: (response) => {
      toast.success(response.message ?? "Permission deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.root() });
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete permission")),
  });
}
