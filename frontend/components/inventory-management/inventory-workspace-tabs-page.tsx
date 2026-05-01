"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryItemsSiPage } from "@/components/inventory-management/inventory-items-si-page";
import { InventoryReportPage, RecipesPage } from "@/components/inventory-management/inventory-pages";
import { PurchaseValidationConfirmPage } from "@/components/inventory-management/purchase-validation-confirm-page";
import { procurementService } from "@/services/inventory-management/procurement.service";

type Scope = "admin" | "food-controller" | "stock-keeper";

function CountBadge({ value }: { value?: number }) {
  if (!value || value < 1) return null;

  return (
    <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px] leading-none">
      {value > 99 ? "99+" : value}
    </Badge>
  );
}

export function InventoryWorkspaceTabsPage({ scope = "food-controller" }: { scope?: Scope }) {
  const purchaseValidationCount = useQuery({
    queryKey: ["inventory-tabs", "purchase-validation-count", "submitted"],
    queryFn: () => procurementService.purchaseOrders({ status: "submitted", per_page: 1 }, "food-controller"),
    staleTime: 30000,
    retry: false,
  });

  const pendingPurchaseValidations = purchaseValidationCount.data?.meta.total ?? 0;

  return (
    <Tabs defaultValue="items" className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <TabsList className="inline-flex min-w-max">
          <TabsTrigger value="items">Inventory Items</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="valuation">Stock Valuation</TabsTrigger>
          <TabsTrigger value="recipe-integrity">Recipe Integrity</TabsTrigger>
          <TabsTrigger value="purchase-validation">
            Purchase Validation
            <CountBadge value={pendingPurchaseValidations} />
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="items" className="mt-0">
        <InventoryItemsSiPage scope={scope} />
      </TabsContent>
      <TabsContent value="recipes" className="mt-0">
        <RecipesPage scope="food-controller" />
      </TabsContent>
      <TabsContent value="low-stock" className="mt-0">
        <InventoryReportPage type="low-stock" />
      </TabsContent>
      <TabsContent value="valuation" className="mt-0">
        <InventoryReportPage type="valuation" />
      </TabsContent>
      <TabsContent value="recipe-integrity" className="mt-0">
        <InventoryReportPage type="recipe-integrity" />
      </TabsContent>
      <TabsContent value="purchase-validation" className="mt-0">
        <PurchaseValidationConfirmPage />
      </TabsContent>
    </Tabs>
  );
}
