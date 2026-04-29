import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/common/queryKeys";
import { menuService, type MenuRoleScope } from "@/services/menu-management";
import type { MenuCategoryParams, MenuItemParams } from "@/types/menu-management";

export function useMenuCategoriesQuery(params: MenuCategoryParams = {}, scope: MenuRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.menu.categories(params, scope),
    queryFn: () => menuService.categories(params, scope),
  });
}

export function useMenuItemsQuery(params: MenuItemParams = {}, scope: MenuRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.menu.items(params, scope),
    queryFn: () => menuService.items(params, scope),
  });
}
