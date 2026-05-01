"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatBaseQuantity } from "@/lib/inventory-management";
import { useCreateRecipeMutation, useUpdateRecipeMutation, useInventoryItemsQuery, useMenuItemsQuery, useRecipesQuery } from "@/hooks/inventory-management";
import type { BaseUnit, InventoryItem, RecipeIngredient, Recipe } from "@/types/inventory-management";

type Scope = "admin" | "food-controller" | "stock-keeper";

type DraftIngredient = RecipeIngredient & {
  inventory_item: InventoryItem;
};

function normalizeUnit(value?: string | null): BaseUnit {
  if (value === "kg" || value === "L" || value === "pcs") return value;
  return "pcs";
}

function itemUnit(item?: Pick<InventoryItem, "base_unit" | "unit"> | null): BaseUnit {
  return normalizeUnit(item?.base_unit ?? item?.unit);
}

function itemName(item?: Pick<InventoryItem, "name" | "sku"> | null) {
  if (!item) return "—";
  return item.sku ? `${item.name} (${item.sku})` : item.name;
}

function recipeMenuName(recipe: Recipe) {
  return recipe.menu_item?.name ?? recipe.name ?? `Menu item #${recipe.menu_item_id}`;
}

function recipeItems(recipe: Recipe) {
  return recipe.items ?? recipe.recipe_items ?? [];
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function RecipesTabPage({ scope = "food-controller" }: { scope?: Scope }) {
  const recipesQuery = useRecipesQuery({ per_page: 50 }, scope);
  const recipes = recipesQuery.data?.data ?? [];

  const menuItems = useMenuItemsQuery({ per_page: 100, is_active: true }, scope);
  const inventoryItems = useInventoryItemsQuery({ per_page: 100 }, scope);

  const createRecipe = useCreateRecipeMutation(undefined, scope);
  const updateRecipe = useUpdateRecipeMutation(undefined, scope);

  const [menuItemId, setMenuItemId] = useState("");
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);

  const stockRows = inventoryItems.data?.data ?? [];
  const menuRows = menuItems.data?.data ?? [];
  const selectedItem = stockRows.find((item) => String(item.id) === inventoryItemId);

  const selectedIngredientIds = useMemo(
    () => new Set(ingredients.map((item) => String(item.inventory_item_id))),
    [ingredients],
  );

  function addIngredient() {
    const numericQuantity = Number(quantity);
    if (!selectedItem || !Number.isFinite(numericQuantity) || numericQuantity <= 0) return;

    setIngredients((current) => [
      ...current,
      {
        inventory_item_id: selectedItem.id,
        quantity: numericQuantity,
        base_unit: itemUnit(selectedItem),
        inventory_item: selectedItem,
      },
    ]);

    setInventoryItemId("");
    setQuantity("");
  }

  function removeIngredient(inventoryItemIdToRemove: number) {
    setIngredients((current) => current.filter((item) => item.inventory_item_id !== inventoryItemIdToRemove));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!menuItemId || ingredients.length < 1) return;

    const existingRecipe = recipes.find((r: Recipe) => String(r.menu_item_id) === menuItemId);
    const payload = {
      menu_item_id: Number(menuItemId),
      items: ingredients.map((item) => ({
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
      })),
    };

    if (existingRecipe) updateRecipe.mutate({ id: existingRecipe.id, payload });
    else createRecipe.mutate(payload);

    setIngredients([]);
    setInventoryItemId("");
    setQuantity("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create recipe</CardTitle>
          <CardDescription>Select a backend menu item, then add ingredients.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Menu item</Label>
              <Select value={menuItemId} onValueChange={setMenuItemId}>
                <SelectTrigger><SelectValue placeholder="Select menu item" /></SelectTrigger>
                <SelectContent>
                  {menuRows.map((menuItem) => (
                    <SelectItem key={menuItem.id} value={String(menuItem.id)}>{menuItem.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-2">
                <Label>Ingredient</Label>
                <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
                  <SelectTrigger><SelectValue placeholder="Select stock item" /></SelectTrigger>
                  <SelectContent>
                    {stockRows.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)} disabled={selectedIngredientIds.has(String(item.id))}>
                        {itemName(item)} — {itemUnit(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity {selectedItem ? `(${itemUnit(selectedItem)})` : ""}</Label>
                <Input type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={addIngredient} disabled={!selectedItem || Number(quantity) <= 0}>
                <Plus className="mr-2 h-4 w-4" /> Add ingredient
              </Button>
            </div>

            {ingredients.length > 0 && (
              <div className="space-y-2 rounded-xl border p-3">
                <p className="text-sm font-medium">Selected ingredients</p>
                {ingredients.map((ingredient) => (
                  <div key={ingredient.inventory_item_id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{itemName(ingredient.inventory_item)}</p>
                      <p className="text-xs text-muted-foreground">{formatBaseQuantity(ingredient.quantity, itemUnit(ingredient.inventory_item))}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(ingredient.inventory_item_id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button type="submit" disabled={!menuItemId || ingredients.length < 1 || createRecipe.isPending || updateRecipe.isPending}>
              {createRecipe.isPending || updateRecipe.isPending ? "Saving..." : "Save recipe"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipes</CardTitle>
          <CardDescription>Existing recipes from backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recipesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading recipes...</p>
          ) : recipes.length ? (
            recipes.map((recipe) => {
              const items = recipeItems(recipe);
              return (
                <div key={recipe.id} className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-semibold">{recipeMenuName(recipe)}</p>
                    <Badge variant="secondary">{items.length} ingredient{items.length === 1 ? "" : "s"}</Badge>
                  </div>
                  <div className="space-y-3">
                    {items.map((ingredient) => {
                      const stockItem = ingredient.inventory_item ?? ingredient.inventoryItem;
                      const unit = normalizeUnit(ingredient.base_unit ?? ingredient.unit ?? stockItem?.base_unit ?? stockItem?.unit);
                      return (
                        <div key={`${recipe.id}-${ingredient.inventory_item_id}`} className="flex items-center justify-between gap-3 text-sm">
                          <span>{itemName(stockItem)}</span>
                          <span className="font-medium">{formatBaseQuantity(ingredient.quantity, unit)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState title="No recipes" description="Create the first recipe from the form." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
