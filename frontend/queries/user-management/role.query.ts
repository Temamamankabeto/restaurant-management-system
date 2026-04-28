import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/common/queryKeys";
import { roleService } from "@/services/user-management/role.service";
import type { RoleListParams } from "@/types/user-management/user.type";

export function useRolesQuery(params: RoleListParams = {}) {
  return useQuery({
    queryKey: queryKeys.roles.list(params),
    queryFn: () => roleService.list(params),
  });
}

export function useRolePermissionCatalogQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.permissions.catalog(search),
    queryFn: () => roleService.permissions(search),
  });
}

export function useRolePermissionsQuery(roleId?: number | string) {
  return useQuery({
    queryKey: roleId ? queryKeys.roles.permissions(roleId) : ["roles", "permissions", "empty"],
    queryFn: () => roleService.rolePermissions(roleId as number | string),
    enabled: Boolean(roleId),
  });
}
