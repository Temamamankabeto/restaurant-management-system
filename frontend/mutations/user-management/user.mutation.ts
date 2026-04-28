import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/common/queryKeys";
import { userService } from "@/services/user-management/user.service";
import type { AssignUserRolePayload, CreateUserPayload, ResetUserPasswordPayload, UpdateUserPayload } from "@/types/user-management/user.type";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useCreateUserMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "User created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create user")),
  });
}

export function useUpdateUserMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateUserPayload }) => userService.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "User updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update user")),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => userService.remove(id),
    onSuccess: (response) => {
      toast.success(response.message ?? "User deleted successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.root() });
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete user")),
  });
}

export function useToggleUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => userService.toggle(id),
    onSuccess: (response) => {
      toast.success(response.message ?? "User status updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.root() });
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update status")),
  });
}

export function useResetUserPasswordMutation(onSuccess?: () => void) {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: ResetUserPasswordPayload }) => userService.resetPassword(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Password reset successful");
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to reset password")),
  });
}

export function useAssignUserRoleMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: AssignUserRolePayload }) => userService.assignRole(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Role updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.users.root() });
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update role")),
  });
}
