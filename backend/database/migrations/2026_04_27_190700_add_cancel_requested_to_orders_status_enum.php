<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','confirmed','out_for_delivery','in_progress','ready','delivered','served','completed','cancel_requested','cancelled') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','confirmed','out_for_delivery','in_progress','ready','delivered','served','completed','cancelled') NOT NULL DEFAULT 'pending'");
    }
};
