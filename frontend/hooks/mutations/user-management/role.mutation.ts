import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/common/queryKeys";
import { roleService } from "@/services/user-management/role.service";
import type { AssignRolePermissionsPayload, RolePayload } from "@/types/user-management/user.type";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useCreateRoleMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RolePayload) => roleService.create(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Role created");
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create role")),
  });
}

export function useUpdateRoleMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: RolePayload }) => roleService.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Role updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update role")),
  });
}

export function useAssignRolePermissionsMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: AssignRolePermissionsPayload }) => roleService.assignPermissions(id, payload),
    onSuccess: (response, variables) => {
      toast.success(response.message ?? "Permissions updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.permissions(variables.id) });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to assign permissions")),
  });
}
