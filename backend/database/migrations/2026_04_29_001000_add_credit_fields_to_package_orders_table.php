<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('package_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('package_orders', 'credit_account_id')) {
                $table->foreignId('credit_account_id')->nullable()->after('organization_id')->constrained('credit_accounts')->nullOnDelete();
            }
            if (!Schema::hasColumn('package_orders', 'credit_account_user_id')) {
                $table->foreignId('credit_account_user_id')->nullable()->after('credit_account_id')->constrained('credit_account_users')->nullOnDelete();
            }
            if (!Schema::hasColumn('package_orders', 'used_by_name')) {
                $table->text('used_by_name')->nullable()->after('credit_status');
            }
            if (!Schema::hasColumn('package_orders', 'used_by_phone')) {
                $table->text('used_by_phone')->nullable()->after('used_by_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('package_orders', function (Blueprint $table) {
            if (Schema::hasColumn('package_orders', 'credit_account_user_id')) {
                $table->dropConstrainedForeignId('credit_account_user_id');
            }
            if (Schema::hasColumn('package_orders', 'credit_account_id')) {
                $table->dropConstrainedForeignId('credit_account_id');
            }
            if (Schema::hasColumn('package_orders', 'used_by_name')) {
                $table->dropColumn('used_by_name');
            }
            if (Schema::hasColumn('package_orders', 'used_by_phone')) {
                $table->dropColumn('used_by_phone');
            }
        });
    }
};
