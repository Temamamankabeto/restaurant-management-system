"use client";

import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryItemsSiPage } from "@/components/inventory-management/inventory-items-si-page";
import { InventoryReportPage } from "@/components/inventory-management/inventory-pages";
import { PurchaseValidationConfirmPage } from "@/components/inventory-management/purchase-validation-confirm-page";
import { RecipesTabPage } from "@/components/inventory-management/recipes-tab-page";
import { LowStockTabPage } from "@/components/inventory-management/low-stock-tab-page";
import { usePermissions, inventoryPermissions, purchasePermissions } from "@/lib/auth/permissions";
import { procurementService } from "@/services/inventory-management/procurement.service";

type Scope = "admin" | "food-controller" | "stock-keeper";

type WorkspaceTab = {
  value: string;
  label: ReactNode;
  content: ReactNode;
  show: boolean;
};

function CountBadge({ value }: { value?: number }) {
  if (!value || value < 1) return null;

  return (
    <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px] leading-none">
      {value > 99 ? "99+" : value}
    </Badge>
  );
}

export function InventoryWorkspaceTabsPage({ scope = "food-controller" }: { scope?: Scope }) {
  const { can, canAny } = usePermissions();

  const canSeePurchaseValidation = canAny([
    inventoryPermissions.recipeIntegrity,
    purchasePermissions.ordersApprove,
    purchasePermissions.ordersRead,
  ]);

  const purchaseValidationCount = useQuery({
    queryKey: ["inventory-tabs", "purchase-validation-count", "submitted"],
    queryFn: () => procurementService.purchaseOrders({ status: "submitted", per_page: 1 }, "food-controller"),
    enabled: canSeePurchaseValidation,
    staleTime: 30000,
    retry: false,
  });

  const pendingPurchaseValidations = purchaseValidationCount.data?.meta.total ?? 0;

  const tabs: WorkspaceTab[] = [
    {
      value: "items",
      label: "Inventory Items",
      show: can(inventoryPermissions.read),
      content: <InventoryItemsSiPage scope={scope} />,
    },
    {
      value: "recipes",
      label: "Recipes",
      show: can(inventoryPermissions.recipesRead),
      content: <RecipesTabPage scope={scope} />,
    },
    {
      value: "low-stock",
      label: "Low Stock",
      show: can(inventoryPermissions.lowStock),
      content: <LowStockTabPage />,
    },
    {
      value: "valuation",
      label: "Stock Valuation",
      show: can(inventoryPermissions.valuation),
      content: <InventoryReportPage type="valuation" />,
    },
    {
      value: "recipe-integrity",
      label: "Recipe Integrity",
      show: can(inventoryPermissions.recipeIntegrity),
      content: <InventoryReportPage type="recipe-integrity" />,
    },
    {
      value: "purchase-validation",
      label: (
        <>
          Purchase Validation
          <CountBadge value={pendingPurchaseValidations} />
        </>
      ),
      show: canSeePurchaseValidation,
      content: <PurchaseValidationConfirmPage />,
    },
  ].filter((tab) => tab.show);

  const defaultTab = tabs[0]?.value ?? "items";

  if (!tabs.length) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="font-medium">No inventory access</p>
        <p className="mt-1 text-sm text-muted-foreground">Your role does not have permission to view this inventory workspace.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <TabsList className="inline-flex min-w-max">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
