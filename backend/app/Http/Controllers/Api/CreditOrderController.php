<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\CreditAccount;
use App\Models\CreditOrder;
use App\Services\CreditOrderService;
use Illuminate\Http\Request;

class CreditOrderController extends Controller
{
    public function __construct(private CreditOrderService $creditOrderService) {}

    private function requirePermission(Request $request, string $permission)
    {
        abort_unless($request->user()?->can($permission), 403, 'You are not authorized to perform this credit action.');
    }

    // existing methods unchanged above ... (trimmed for brevity in commit message context)

    public function approve(Request $request, $id)
    {
        $this->requirePermission($request, 'credit.orders.create');

        $order = CreditOrder::findOrFail($id);

        if ($order->status === 'credit_pending') {
            $order->status = 'credit_approved';
            $order->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Credit order approved.',
            'data' => $order->fresh(['account','authorizedUser','order','bill']),
        ]);
    }

    public function reject(Request $request, $id)
    {
        $this->requirePermission($request, 'credit.orders.create');

        $order = CreditOrder::findOrFail($id);

        if ($order->status === 'credit_pending') {
            $order->status = 'blocked';
            $order->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Credit order rejected.',
            'data' => $order->fresh(['account','authorizedUser','order','bill']),
        ]);
    }
}
