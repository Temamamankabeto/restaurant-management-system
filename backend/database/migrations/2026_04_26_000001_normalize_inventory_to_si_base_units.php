<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            if (! Schema::hasColumn('inventory_items', 'base_unit')) {
                $table->enum('base_unit', ['g', 'ml', 'pc'])->default('pc')->after('sku');
            }
        });

        try {
            if (Schema::hasColumn('inventory_items', 'unit')) {
                DB::statement("UPDATE inventory_items SET base_unit = CASE LOWER(unit) WHEN 'kg' THEN 'g' WHEN 'g' THEN 'g' WHEN 'gram' THEN 'g' WHEN 'grams' THEN 'g' WHEN 'liter' THEN 'ml' WHEN 'litre' THEN 'ml' WHEN 'l' THEN 'ml' WHEN 'ml' THEN 'ml' WHEN 'pcs' THEN 'pc' WHEN 'piece' THEN 'pc' WHEN 'pieces' THEN 'pc' WHEN 'pc' THEN 'pc' ELSE 'pc' END");
            }
        } catch (\Throwable $e) {}

        Schema::table('recipe_items', function (Blueprint $table) {
            if (! Schema::hasColumn('recipe_items', 'base_unit')) {
                $table->enum('base_unit', ['g', 'ml', 'pc'])->default('pc')->after('quantity');
            }
        });

        try {
            if (Schema::hasColumn('recipe_items', 'unit')) {
                DB::statement("UPDATE recipe_items ri JOIN inventory_items ii ON ii.id = ri.inventory_item_id SET ri.base_unit = ii.base_unit");
            }
        } catch (\Throwable $e) {}

        Schema::table('purchase_order_items', function (Blueprint $table) {
            if (! Schema::hasColumn('purchase_order_items', 'base_unit')) {
                $table->enum('base_unit', ['g', 'ml', 'pc'])->default('pc')->after('quantity');
            }
        });

        try {
            DB::statement("UPDATE purchase_order_items poi JOIN inventory_items ii ON ii.id = poi.inventory_item_id SET poi.base_unit = ii.base_unit");
        } catch (\Throwable $e) {}

        Schema::table('stock_receiving_items', function (Blueprint $table) {
            if (! Schema::hasColumn('stock_receiving_items', 'base_unit')) {
                $table->enum('base_unit', ['g', 'ml', 'pc'])->default('pc')->after('quantity_received');
            }
        });

        try {
            DB::statement("UPDATE stock_receiving_items sri JOIN inventory_items ii ON ii.id = sri.inventory_item_id SET sri.base_unit = ii.base_unit");
        } catch (\Throwable $e) {}

        Schema::dropIfExists('inventory_unit_conversions');
    }

    public function down(): void
    {
    }
};
