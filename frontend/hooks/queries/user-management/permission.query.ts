import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/common/queryKeys";
import { permissionService } from "@/services/user-management/permission.service";
import type { PermissionListParams } from "@/types/user-management/user.type";

export function usePermissionsQuery(params: PermissionListParams = {}) {
  return useQuery({
    queryKey: queryKeys.permissions.list(params),
    queryFn: () => permissionService.list(params),
  });
}

export function useAllPermissionsQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.permissions.all(search),
    queryFn: () => permissionService.all(search),
  });
}
