import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/hooks/queryKeys";
import { userManagementService } from "@/services/user-management";
import type {
  AssignUserRolePayload,
  CreateUserPayload,
  ResetUserPasswordPayload,
  UpdateUserPayload,
  UserListParams,
} from "@/types/user-management/user.type";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.users.root() });
}

export function useUsersQuery(params: UserListParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userManagementService.users.list(params),
  });
}

export function useUserQuery(id?: number | string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ""),
    queryFn: () => userManagementService.users.show(id as number | string),
    enabled: Boolean(id),
  });
}

export function useUserRolesLiteQuery() {
  return useQuery({
    queryKey: queryKeys.roles.lite(),
    queryFn: () => userManagementService.users.rolesLite(),
  });
}

export function useWaitersLiteQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.tables.waiters(search),
    queryFn: () => userManagementService.users.waitersLite(search),
  });
}

export function useCreateUserMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userManagementService.users.create(payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "User created");
      invalidateUsers(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create user")),
  });
}

export function useUpdateUserMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateUserPayload }) => userManagementService.users.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "User updated");
      invalidateUsers(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update user")),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => userManagementService.users.remove(id),
    onSuccess: (response) => {
      toast.success(response.message ?? "User deleted");
      invalidateUsers(queryClient);
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete user")),
  });
}

export function useToggleUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => userManagementService.users.toggle(id),
    onSuccess: (response) => {
      toast.success(response.message ?? "User status updated");
      invalidateUsers(queryClient);
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update user status")),
  });
}

export function useResetUserPasswordMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: ResetUserPasswordPayload }) =>
      userManagementService.users.resetPassword(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "Password reset");
      invalidateUsers(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to reset password")),
  });
}

export function useAssignUserRoleMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: AssignUserRolePayload }) => userManagementService.users.assignRole(id, payload),
    onSuccess: (response) => {
      toast.success(response.message ?? "User role updated");
      invalidateUsers(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to assign role")),
  });
}
