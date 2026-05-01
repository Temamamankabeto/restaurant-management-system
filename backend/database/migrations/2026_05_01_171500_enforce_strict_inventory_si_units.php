<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Strict inventory units used by the frontend and backend.
     * Mass  => kg
     * Liquid => L
     * Count => pcs
     */
    private array $unitColumns = [
        ['table' => 'inventory_items', 'column' => 'base_unit', 'nullable' => false, 'default' => 'pcs'],
        ['table' => 'inventory_items', 'column' => 'unit', 'nullable' => true, 'default' => null],
        ['table' => 'recipe_items', 'column' => 'base_unit', 'nullable' => true, 'default' => null],
        ['table' => 'recipe_items', 'column' => 'unit', 'nullable' => true, 'default' => null],
        ['table' => 'purchase_order_items', 'column' => 'unit', 'nullable' => true, 'default' => null],
        ['table' => 'inventory_transactions', 'column' => 'unit', 'nullable' => true, 'default' => null],
        ['table' => 'inventory_item_batches', 'column' => 'unit', 'nullable' => true, 'default' => null],
        ['table' => 'stock_receiving_items', 'column' => 'unit', 'nullable' => true, 'default' => null],
    ];

    public function up(): void
    {
        foreach ($this->unitColumns as $definition) {
            if (! $this->columnExists($definition['table'], $definition['column'])) {
                continue;
            }

            $table = $definition['table'];
            $column = $definition['column'];

            // Convert old frontend units to the strict units before changing ENUM.
            DB::statement("UPDATE `{$table}` SET `{$column}` = 'kg' WHERE `{$column}` = 'g'");
            DB::statement("UPDATE `{$table}` SET `{$column}` = 'L' WHERE `{$column}` = 'ml'");
            DB::statement("UPDATE `{$table}` SET `{$column}` = 'pcs' WHERE `{$column}` = 'pc'");

            // Normalize unsupported text units to pcs to prevent ENUM truncation failures.
            DB::statement("UPDATE `{$table}` SET `{$column}` = 'pcs' WHERE `{$column}` IS NOT NULL AND `{$column}` NOT IN ('kg', 'L', 'pcs')");

            $null = $definition['nullable'] ? 'NULL' : 'NOT NULL';
            $default = $definition['default'] === null ? '' : " DEFAULT '{$definition['default']}'";

            DB::statement("ALTER TABLE `{$table}` MODIFY `{$column}` ENUM('kg', 'L', 'pcs') {$null}{$default}");
        }
    }

    public function down(): void
    {
        foreach ($this->unitColumns as $definition) {
            if (! $this->columnExists($definition['table'], $definition['column'])) {
                continue;
            }

            $table = $definition['table'];
            $column = $definition['column'];
            $null = $definition['nullable'] ? 'NULL' : 'NOT NULL';
            $default = $definition['default'] === null ? '' : " DEFAULT '{$definition['default']}'";

            DB::statement("ALTER TABLE `{$table}` MODIFY `{$column}` VARCHAR(20) {$null}{$default}");
        }
    }

    private function columnExists(string $table, string $column): bool
    {
        $database = DB::getDatabaseName();

        return DB::table('information_schema.COLUMNS')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', $table)
            ->where('COLUMN_NAME', $column)
            ->exists();
    }
};
