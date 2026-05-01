<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    DB::statement("
        ALTER TABLE purchase_orders
        MODIFY COLUMN status ENUM(
            'draft',
            'submitted',
            'fb_validated',
            'validation_rejected',
            'approved',
            'partially_received',
            'completed',
            'cancelled'
        ) DEFAULT 'draft'
    ");
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
