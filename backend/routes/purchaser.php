<?php

use App\Http\Controllers\Api\PurchaseOrderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])
    ->prefix('purchaser')
    ->group(function () {

        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);

        Route::get('/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);

        Route::get('/purchase-orders/{id}/history', [PurchaseOrderController::class, 'history']);

        Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);

        Route::post('/purchase-orders/{id}/submit', [PurchaseOrderController::class, 'submit']);
    });