import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/common/queryKeys";
import { userService } from "@/services/user-management/user.service";
import type { UserListParams } from "@/types/user-management/user.type";

export function useUsersQuery(params: UserListParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.list(params),
  });
}

export function useUserQuery(id?: number | string) {
  return useQuery({
    queryKey: id ? queryKeys.users.detail(id) : ["users", "detail", "empty"],
    queryFn: () => userService.show(id as number | string),
    enabled: Boolean(id),
  });
}

export function useRolesLiteQuery() {
  return useQuery({
    queryKey: queryKeys.roles.lite(),
    queryFn: () => userService.rolesLite(),
  });
}
