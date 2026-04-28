<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('credit_order_authorized_users')) {
            return;
        }

        Schema::create('credit_order_authorized_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_order_id')->constrained('credit_orders')->cascadeOnDelete();
            $table->foreignId('credit_account_id')->constrained('credit_accounts')->cascadeOnDelete();
            $table->foreignId('credit_account_user_id')->constrained('credit_account_users')->cascadeOnDelete();
            $table->decimal('allocated_amount', 12, 2)->default(0);
            $table->string('full_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('position')->nullable();
            $table->string('employee_id')->nullable();
            $table->timestamps();

            $table->unique(['credit_order_id', 'credit_account_user_id'], 'coau_order_user_unique');
            $table->index(['credit_account_id', 'credit_account_user_id'], 'coau_account_user_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_order_authorized_users');
    }
};
