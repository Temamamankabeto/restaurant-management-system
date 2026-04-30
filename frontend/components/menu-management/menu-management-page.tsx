"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { can, menuPermissions } from "@/lib/auth/permissions";

import {
  useMenuCategoriesQuery,
  useMenuItemsQuery,
  useCreateMenuCategoryMutation,
  useCreateMenuItemMutation,
  useDeleteMenuCategoryMutation,
  useDeleteMenuItemMutation,
  useMenuItemAvailabilityMutation,
  useSetMenuItemModeMutation,
  useToggleMenuCategoryMutation,
  useToggleMenuItemMutation,
  useUpdateMenuCategoryMutation,
  useUpdateMenuItemMutation,
} from "@/hooks/menu-management/menu";

import type { MenuCategory, MenuCategoryPayload, MenuItem, MenuItemPayload, MenuItemParams, MenuType } from "@/types/menu-management";

// rest unchanged
export { MenuManagementPage as default };
