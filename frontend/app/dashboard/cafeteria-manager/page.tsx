"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Boxes, ClipboardCheck, ClipboardList, Package, PackageSearch, Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { procurementService } from "@/services/inventory-management/procurement.service";

const inventoryCards = [
  {
    title: "Inventory Overview",
    description: "Open stock summary, latest movements, low-stock risk, and valuation snapshot.",
    href: "/dashboard/inventory/overview",
    icon: Warehouse,
  },
  {
    title: "Inventory Items",
    description: "View and manage all stock items using base SI units: g, ml, and pc.",
    href: "/dashboard/inventory/items",
    icon: Package,
  },
  {
    title: "Stock Movements",
    description: "Review stock in, out, adjustment, transfer, and waste transaction history.",
    href: "/dashboard/inventory/movements",
    icon: ClipboardList,
  },
  {
    title: "Stock Valuation",
    description: "Analyze inventory value by item with manager valuation report.",
    href: "/dashboard/inventory/valuation",
    icon: BarChart3,
  },
  {
    title: "Low Stock",
    description: "See items below minimum quantity and shortage priority.",
    href: "/dashboard/inventory/low-stock",
    icon: AlertTriangle,
  },
  {
    title: "Recipe Integrity",
    description: "Check missing recipes, missing inventory links, and menu tracking issues.",
    href: "/dashboard/inventory/recipe-integrity",
    icon: PackageSearch,
  },
];

export default function CafeteriaManagerDashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard", "manager", "purchase", "fb_validated"],
    queryFn: () => procurementService.purchaseOrders({ status: "fb_validated", per_page: 1 }, "admin"),
    staleTime: 30000,
    retry: false,
  });

  const count = query.data?.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cafeteria Manager Dashboard</h1>
        <p className="text-muted-foreground">Operations, purchase review, inventory oversight, and reports.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Requests Ready</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{query.isLoading ? "..." : count}</div>
              <p className="mt-1 text-xs text-muted-foreground">Validated requests waiting for manager review.</p>
            </div>
            <Button asChild size="sm" className="w-full" variant={count > 0 ? "default" : "outline"}>
              <Link href="/dashboard/purchases/requests">Open requests</Link>
            </Button>
          </CardContent>
        </Card>

        {inventoryCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="rounded-2xl transition hover:border-primary/50 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="min-h-10 text-xs text-muted-foreground">{item.description}</p>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Admin / Manager Inventory Module</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the cards above to access every manager inventory screen: overview, item list, movements, valuation, low-stock report, and recipe integrity report.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
