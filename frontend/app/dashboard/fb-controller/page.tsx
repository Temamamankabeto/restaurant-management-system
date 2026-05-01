"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, Package, ShoppingCart, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const moduleCards = [
  {
    title: "Inventory Forecast",
    description: "Open F&B inventory forecast workspace for stock risk, recipes, waste, valuation, and purchase validation.",
    href: "/dashboard/fb-controller/inventory-forecast",
    icon: Package,
  },
  {
    title: "Recipe Module",
    description: "Create and maintain recipe ingredients and menu item stock usage.",
    href: "/dashboard/inventory/recipes",
    icon: ClipboardList,
  },
  {
    title: "Menu Module",
    description: "Menu setup, availability, pricing, and category workspaces.",
    href: "/dashboard/modules/menu",
    icon: Utensils,
  },
  {
    title: "Purchase Validation",
    description: "Validate submitted purchase requests before manager approval.",
    href: "/dashboard/purchases/validation",
    icon: ShoppingCart,
  },
  {
    title: "Reports Module",
    description: "Operational and inventory reports will be expanded here.",
    href: "/dashboard/modules/reports",
    icon: BarChart3,
  },
];

export default function FBControllerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">F & B Controller Dashboard</h1>
        <p className="text-muted-foreground">Main control center for F&B modules. Open each module screen from the cards below.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map((item) => {
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
    </div>
  );
}
