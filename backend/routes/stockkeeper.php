<?php

use App\Http\Controllers\Api\InventoryBatchController;
use App\Http\Controllers\Api\InventoryItemController;
use App\Http\Controllers\Api\InventoryTransactionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])
    ->prefix('stock-keeper')
    ->group(function () {
        Route::get('/inventory/items', [InventoryItemController::class, 'index']);
        Route::get('/inventory/items/{id}', [InventoryItemController::class, 'show']);

        Route::get('/inventory/transactions', [InventoryTransactionController::class, 'index']);
        Route::post('/inventory/items/{id}/adjust', [InventoryTransactionController::class, 'adjust']);
        Route::post('/inventory/items/{id}/waste', [InventoryTransactionController::class, 'waste']);
        Route::post('/inventory/items/{id}/transfer', [InventoryTransactionController::class, 'transfer']);

        Route::get('/inventory/batches', [InventoryBatchController::class, 'index']);
    });
