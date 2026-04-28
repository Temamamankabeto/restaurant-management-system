import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Package,
  PackageCheck,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Table2,
  Truck,
  Trash2,
  UserCog,
  Users,
  Utensils,
  Warehouse,
  Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { dashboardConfig, normalizeRole, type AppRoleKey } from "@/config/dashboard.config";

export type SidebarChildItem = { label: string; href: string; permission?: string };
export type SidebarItem = { label: string; href?: string; icon: LucideIcon; permission?: string; children?: SidebarChildItem[] };
export type SidebarSection = { title: string; items: SidebarItem[] };
export type RoleSidebar = { title: string; icon: LucideIcon; sections: SidebarSection[] };

const s = (title: string, items: SidebarItem[]): SidebarSection => ({ title, items });
const dashboardItem = (role: AppRoleKey): SidebarItem => ({ label: "Dashboard", href: dashboardConfig[role].route, icon: LayoutDashboard });

export const sidebarConfig: Record<AppRoleKey, RoleSidebar> = {
  "cafeteria-manager": {
    title: "Cafeteria Manager",
    icon: Store,
    sections: [
      s("Main", [dashboardItem("cafeteria-manager")]),
      s("Management", [
        { label: "User Management", icon: UserCog, children: [
          { label: "Users", href: "/dashboard/users", permission: "users.read" },
          { label: "Roles", href: "/dashboard/users/roles", permission: "roles.read" },
          { label: "Permissions", href: "/dashboard/users/permissions", permission: "permissions.read" },
        ]},
        { label: "Menu Management", href: "/dashboard/modules/menu", icon: Utensils, permission: "menu.read" },
        { label: "Table Management", href: "/dashboard/modules/tables", icon: Table2, permission: "tables.read" },
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart, permission: "orders.read" },
        { label: "Credit Orders", href: "/dashboard/credit-orders", icon: CreditCard },
        { label: "Credit Accounts", href: "/dashboard/credit-accounts", icon: Users },
      ]),
      s("Catering", [
        { label: "Packages", href: "/dashboard/catering/packages", icon: Package, permission: "packages.read" },
        { label: "Package Orders", href: "/dashboard/catering/package-orders", icon: PackageCheck, permission: "package.orders.read" },
      ]),
      s("Reports", [{ label: "Reports", href: "/dashboard/modules/reports", icon: BarChart3, permission: "reports.inventory.read" }, { label: "Inventory Overview", href: "/dashboard/inventory/overview", icon: Warehouse, permission: "inventory.read" }, { label: "Purchase Requests", href: "/dashboard/purchases/requests", icon: ClipboardList, permission: "purchase_orders.approve" }]),
      s("System", [{ label: "Notifications", href: "/dashboard/modules/notifications", icon: Bell }, { label: "Settings", href: "/dashboard/modules/settings", icon: Settings }]),
    ],
  },
  "fb-controller": {
    title: "F & B Controller",
    icon: ClipboardList,
    sections: [
      s("Main", [dashboardItem("fb-controller")]),
      s("Food & Beverage", [
        { label: "Menu Management", href: "/dashboard/modules/menu", icon: Utensils, permission: "menu.read" },
        { label: "Inventory Items", href: "/dashboard/inventory/items", icon: Boxes, permission: "inventory.read" },
        { label: "Recipes", href: "/dashboard/inventory/recipes", icon: BookOpen, permission: "recipes.read" },
        { label: "Low Stock", href: "/dashboard/inventory/low-stock", icon: Warehouse, permission: "inventory.low_stock.read" },
        { label: "Stock Valuation", href: "/dashboard/inventory/valuation", icon: BarChart3, permission: "inventory.valuation.read" },
        { label: "Recipe Integrity", href: "/dashboard/inventory/recipe-integrity", icon: ShieldCheck, permission: "recipes.integrity.read" },
        { label: "Purchase Validation", href: "/dashboard/purchases/validation", icon: ClipboardList, permission: "recipes.integrity.read" },
      ]),
    ],
  },
  "finance-manager": {
    title: "Finance Manager",
    icon: BarChart3,
    sections: [
      s("Main", [dashboardItem("finance-manager")]),
      s("Finance", [
        { label: "Payments", href: "/dashboard/modules/payments", icon: CreditCard, permission: "payments.read" },
        { label: "Bills", href: "/dashboard/modules/bills", icon: Receipt, permission: "bills.read" },
        { label: "Cash Shifts", href: "/dashboard/modules/cash-shifts", icon: PackageCheck, permission: "cash_shift.read" },
        { label: "Finance Reports", href: "/dashboard/modules/reports/finance", icon: BarChart3, permission: "reports.financial.read" },
        { label: "Credit Orders", href: "/dashboard/credit-orders", icon: CreditCard },
        { label: "Credit Accounts", href: "/dashboard/credit-accounts", icon: Users },
      ]),
    ],
  },
  "stock-keeper": {
    title: "Stock Keeper",
    icon: Warehouse,
    sections: [
      s("Main", [dashboardItem("stock-keeper")]),
      s("Stock", [
        { label: "Inventory Items", href: "/dashboard/inventory/items", icon: Package, permission: "inventory.read" },
        { label: "Receive Ordered Items", href: "/dashboard/purchases/receiving", icon: PackageCheck, permission: "stock.receive" },
        { label: "Adjustments", href: "/dashboard/inventory/adjustments", icon: ClipboardList, permission: "inventory.adjustments.create" },
        { label: "Waste / Damage", href: "/dashboard/inventory/waste", icon: Trash2, permission: "inventory.waste.create" },
        { label: "Stock Movements", href: "/dashboard/inventory/movements", icon: Boxes, permission: "inventory.movements.read" },
        { label: "Batches", href: "/dashboard/inventory/batches", icon: Warehouse, permission: "inventory.batches.read" },
      ]),
    ],
  },
  purchaser: {
    title: "Purchaser",
    icon: Truck,
    sections: [
      s("Main", [dashboardItem("purchaser")]),
      s("Procurement", [
        { label: "Suppliers", href: "/dashboard/purchases/suppliers", icon: Truck, permission: "suppliers.read" },
        { label: "Purchase Requests", href: "/dashboard/purchases/requests", icon: ClipboardList, permission: "purchase_orders.read" },
      ]),
    ],
  },
  cashier: {
    title: "Cashier",
    icon: CreditCard,
    sections: [
      s("Main", [dashboardItem("cashier")]),
      s("POS", [
        { label: "POS Orders", href: "/dashboard/pos/orders", icon: ShoppingCart, permission: "orders.read" },
        { label: "Payments", href: "/dashboard/modules/cashier/payments", icon: CreditCard, permission: "payments.create" },
        { label: "Receipts", href: "/dashboard/modules/cashier/receipts", icon: Receipt, permission: "payments.read" },
        { label: "Shift Report", href: "/dashboard/modules/cashier/shift", icon: BarChart3, permission: "cash_shift.read" },
      ]),
    ],
  },
  "kitchen-staff": {
    title: "Kitchen Staff",
    icon: ChefHat,
    sections: [
      s("Main", [dashboardItem("kitchen-staff")]),
      s("Kitchen", [
        { label: "Kitchen Tickets", href: "/dashboard/modules/kitchen/tickets", icon: ChefHat, permission: "kitchen.queue.read" },
        { label: "Preparing", href: "/dashboard/modules/kitchen/preparing", icon: Utensils, permission: "kitchen.queue.update" },
        { label: "Ready Orders", href: "/dashboard/modules/kitchen/ready", icon: PackageCheck, permission: "kitchen.queue.update" },
      ]),
    ],
  },
  barman: {
    title: "Barman",
    icon: Wine,
    sections: [
      s("Main", [dashboardItem("barman")]),
      s("Bar", [
        { label: "Bar Tickets", href: "/dashboard/modules/bar/tickets", icon: Wine, permission: "bar.queue.read" },
        { label: "Preparing Drinks", href: "/dashboard/modules/bar/preparing", icon: Utensils, permission: "bar.queue.update" },
        { label: "Ready Drinks", href: "/dashboard/modules/bar/ready", icon: PackageCheck, permission: "bar.queue.update" },
      ]),
    ],
  },
  waiter: {
    title: "Waiter",
    icon: Users,
    sections: [
      s("Main", [dashboardItem("waiter")]),
      s("Service", [
        { label: "Tables", href: "/dashboard/modules/waiter/tables", icon: Table2, permission: "tables.read" },
        { label: "Menu", href: "/dashboard/modules/waiter/menu", icon: Utensils, permission: "menu.read" },
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart, permission: "orders.read" },
      ]),
    ],
  },
  customer: {
    title: "Customer",
    icon: Users,
    sections: [
      s("Main", [dashboardItem("customer")]),
      s("Customer", [
        { label: "Public Menu", href: "/dashboard/modules/public/menu", icon: Utensils },
        { label: "My Orders", href: "/dashboard/modules/customer/orders", icon: ShoppingCart },
        { label: "My Bills", href: "/dashboard/modules/customer/bills", icon: Receipt },
      ]),
    ],
  },
};

export function getSidebarForRole(role?: string | null): RoleSidebar {
  return sidebarConfig[normalizeRole(role)];
}

export function filterSidebarByPermissions(roleSidebar: RoleSidebar, permissions: string[] = []) {
  return roleSidebar.sections
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          const children = item.children?.filter((child) => !child.permission || permissions.includes(child.permission));
          if (item.children) return children?.length ? { ...item, children } : null;
          return !item.permission || permissions.includes(item.permission) ? item : null;
        })
        .filter(Boolean) as SidebarItem[],
    }))
    .filter((section) => section.items.length > 0);
}
