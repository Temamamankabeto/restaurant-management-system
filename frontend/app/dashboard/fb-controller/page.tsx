"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardList, PackageCheck, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import inventoryService from "@/services/inventory-management/inventory.service";
import { procurementService } from "@/services/inventory-management/procurement.service";

function MetricCard({ title, value, description, href, action, icon: Icon }: { title: string; value: number | string; description: string; href: string; action: string; icon: typeof ShieldCheck }) {
  const numericValue = typeof value === "number" ? value : Number(value || 0);
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-3xl font-bold">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <Button asChild size="sm" className="w-full" variant={numericValue > 0 ? "default" : "outline"}>
          <Link href={href}>{action}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FBControllerDashboardPage() {
  const pendingValidation = useQuery({
    queryKey: ["fb-controller-dashboard", "submitted-purchase-orders"],
    queryFn: () => procurementService.purchaseOrders({ status: "submitted", per_page: 1 }, "food-controller"),
    staleTime: 30000,
    retry: false,
  });

  const lowStock = useQuery({
    queryKey: ["fb-controller-dashboard", "low-stock"],
    queryFn: () => inventoryService.lowStock("food-controller"),
    staleTime: 30000,
    retry: false,
  });

  const recipeIntegrity = useQuery({
    queryKey: ["fb-controller-dashboard", "recipe-integrity"],
    queryFn: () => inventoryService.recipeIntegrity("food-controller"),
    staleTime: 30000,
    retry: false,
  });

  const unreceivedOrders = useQuery({
    queryKey: ["fb-controller-dashboard", "approved-unreceived-purchase-orders"],
    queryFn: () => procurementService.purchaseOrders({ status: "approved", per_page: 1 }, "food-controller"),
    staleTime: 30000,
    retry: false,
  });

  const integrityIssues = useMemo(() => {
    const summary = recipeIntegrity.data?.summary ?? {};
    const summaryTotal = Object.values(summary).reduce((sum, value) => sum + Number(value ?? 0), 0);
    return summaryTotal || recipeIntegrity.data?.rows?.length || 0;
  }, [recipeIntegrity.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">F & B Controller Dashboard</h1>
        <p className="text-muted-foreground">Recipe integrity, stock analysis, low-stock alerts, and purchase validation workload.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pending Validation"
          value={pendingValidation.isLoading ? "..." : pendingValidation.data?.meta.total ?? 0}
          description="Submitted purchase requests waiting for F&B validation."
          href="/dashboard/purchases/validation"
          action="Open validation"
          icon={ShieldCheck}
        />
        <MetricCard
          title="Low Stock Alerts"
          value={lowStock.isLoading ? "..." : lowStock.data?.length ?? 0}
          description="Inventory items at or below their minimum quantity."
          href="/dashboard/inventory/low-stock"
          action="Review low stock"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Recipe Integrity Issues"
          value={recipeIntegrity.isLoading ? "..." : integrityIssues}
          description="Missing recipes, empty recipes, or missing inventory links."
          href="/dashboard/inventory/recipe-integrity"
          action="Fix recipes"
          icon={ClipboardList}
        />
        <MetricCard
          title="Unreceived Orders"
          value={unreceivedOrders.isLoading ? "..." : unreceivedOrders.data?.meta.total ?? 0}
          description="Approved purchase orders still waiting for stock receiving."
          href="/dashboard/purchases/receiving"
          action="View receiving"
          icon={PackageCheck}
        />
      </div>
    </div>
  );
}
