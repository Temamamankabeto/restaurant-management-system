"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryItemsSiPage } from "@/components/inventory-management/inventory-items-si-page";
import { InventoryReportPage, RecipesPage } from "@/components/inventory-management/inventory-pages";
import { PurchaseValidationConfirmPage } from "@/components/inventory-management/purchase-validation-confirm-page";

type Scope = "admin" | "food-controller" | "stock-keeper";

export function InventoryWorkspaceTabsPage({ scope = "food-controller" }: { scope?: Scope }) {
  return (
    <Tabs defaultValue="items" className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <TabsList className="inline-flex min-w-max">
          <TabsTrigger value="items">Inventory Items</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="valuation">Stock Valuation</TabsTrigger>
          <TabsTrigger value="recipe-integrity">Recipe Integrity</TabsTrigger>
          <TabsTrigger value="purchase-validation">Purchase Validation</TabsTrigger>
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
