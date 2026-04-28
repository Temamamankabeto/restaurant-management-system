<?php

use App\Http\Controllers\Api\InventoryBatchController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])
    ->prefix('stock-keeper')
    ->group(function () {
        Route::get('/inventory/batches', [InventoryBatchController::class, 'index']);
    });
