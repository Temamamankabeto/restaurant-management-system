<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BarTicket;
use App\Models\CreditAccount;
use App\Models\CreditAccountUser;
use App\Models\KitchenTicket;
use App\Models\MenuItem;
use App\Models\Order;
use App\Services\WaiterOrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PublicCreditCardOrderController extends Controller
{
    public function __construct(private WaiterOrderService $waiterOrderService) {}

    public function validateCard(Request $request)
    {
        $data = $request->validate([
            'card_number' => ['required', 'string', 'max:255'],
        ]);

        return response()->json($this->validateCardValue((string) $data['card_number']));
    }

    public function menu(Request $request)
    {
        $query = MenuItem::query()
            ->with('category')
            ->where('is_active', true)
            ->where('is_available', true)
            ->orderBy('type')
            ->orderBy('name');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('category', fn ($cat) => $cat->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('type') && in_array($request->type, ['food', 'drink'], true)) {
            $query->where('type', $request->type);
        }

        $items = $query->get()->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'type' => $item->type,
            'price' => (float) $item->price,
            'description' => $item->description,
            'category' => optional($item->category)->name,
            'image_url' => $item->image ? url('storage/' . $item->image) : ($item->image_url ?? null),
            'is_available' => (bool) $item->is_available,
        ])->values();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'card_number' => ['required', 'string', 'max:255'],
            'order_type' => ['nullable', 'in:takeaway'],
            'customer_name' => ['nullable', 'string', 'max:120'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        $validatedCard = $this->validateCardValue((string) $data['card_number']);

        if (!($validatedCard['success'] ?? false)) {
            return response()->json($validatedCard, (int) ($validatedCard['status_code'] ?? 422));
        }

        $account = CreditAccount::lockForUpdate()->findOrFail($validatedCard['data']['credit_account_id']);
        $available = round((float) $account->credit_limit - (float) $account->current_balance, 2);
        $total = $this->calculateTotal($data['items']);

        if ($available <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Credit account available balance is empty. Ask account holder to request additional credit limit.',
                'data' => ['available_limit' => $available],
            ], 422);
        }

        if ($total > $available) {
            return response()->json([
                'success' => false,
                'message' => 'Credit limit exceeded. Remaining limit: ' . number_format($available, 2),
                'data' => ['available_limit' => $available, 'order_total' => $total],
            ], 422);
        }

        try {
            $systemUserId = (int) config('app.guest_user_id', 1);
            $payload = [
                'order_type' => 'takeaway',
                'waiter_id' => $systemUserId,
                'customer_name' => $data['customer_name'] ?? ($validatedCard['data']['authorized_user']['full_name'] ?? $account->name),
                'customer_phone' => $data['customer_phone'] ?? ($validatedCard['data']['authorized_user']['phone'] ?? $account->phone ?? null),
                'payment_type' => 'credit',
                'credit_account_id' => $account->id,
                'credit_account_user_id' => $validatedCard['data']['credit_account_user_id'] ?? null,
                'credit_notes' => 'Public kiosk credit card order',
                'notes' => $data['notes'] ?? null,
                'items' => $data['items'],
                '_source' => 'public_credit_kiosk',
            ];

            $order = $this->waiterOrderService->createOrder($payload, $systemUserId);
            $order->load(['items.menuItem', 'items.kitchenTicket', 'items.barTicket', 'bill', 'creditOrder.account', 'creditOrder.authorizedUser']);

            $ticketNumbers = $order->items->map(function ($item) {
                $ticket = $item->station === 'kitchen' ? $item->kitchenTicket : $item->barTicket;
                return [
                    'item_id' => $item->id,
                    'station' => $item->station,
                    'ticket_id' => $ticket?->id,
                    'ticket_number' => strtoupper($item->station) . '-' . str_pad((string) ($ticket?->id ?? $item->id), 5, '0', STR_PAD_LEFT),
                    'item_name' => optional($item->menuItem)->name,
                ];
            })->values();

            $remainingAfter = round((float) $account->fresh()->credit_limit - (float) $account->fresh()->current_balance, 2);

            return response()->json([
                'success' => true,
                'message' => 'Credit card order submitted successfully.',
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'bill_id' => $order->bill?->id,
                    'bill_number' => $order->bill?->bill_number,
                    'bill_status' => $order->bill?->status,
                    'total' => (float) $order->total,
                    'preparation_estimate_minutes' => $this->estimatePreparationMinutes($order),
                    'tickets' => $ticketNumbers,
                    'account' => [
                        'id' => $account->id,
                        'name' => $account->name,
                        'remaining_limit' => $remainingAfter,
                    ],
                    'items' => $order->items->map(fn ($item) => [
                        'name' => optional($item->menuItem)->name,
                        'quantity' => (float) $item->quantity,
                        'unit_price' => (float) $item->unit_price,
                        'line_total' => (float) $item->line_total,
                        'station' => $item->station,
                        'status' => $item->item_status,
                    ])->values(),
                ],
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    private function validateCardValue(string $cardNumber): array
    {
        $parsed = $this->parseCard($cardNumber);

        if (!$parsed['credit_account_id']) {
            return ['success' => false, 'status_code' => 422, 'message' => 'Invalid card number.'];
        }

        $account = CreditAccount::with(['authorizedUsers'])->find($parsed['credit_account_id']);

        if (!$account) {
            return ['success' => false, 'status_code' => 404, 'message' => 'Credit account card was not found.'];
        }

        $available = round((float) $account->credit_limit - (float) $account->current_balance, 2);
        $isOrganization = strtolower((string) $account->account_type) === 'organization';
        $authorizedUser = null;

        if (!$account->is_credit_enabled || $account->status !== 'active') {
            return ['success' => false, 'status_code' => 422, 'message' => 'Credit account is blocked or credit is disabled.', 'data' => ['account' => $account, 'available_limit' => $available]];
        }

        if ($isOrganization) {
            if (!$parsed['authorized_user_id']) {
                return ['success' => false, 'status_code' => 422, 'message' => 'Organization card must include an authorized user.', 'data' => ['account' => $account, 'available_limit' => $available]];
            }

            $authorizedUser = CreditAccountUser::where('credit_account_id', $account->id)
                ->where('id', $parsed['authorized_user_id'])
                ->first();

            if (!$authorizedUser) {
                return ['success' => false, 'status_code' => 404, 'message' => 'Authorized user card was not found for this account.'];
            }

            if (!$authorizedUser->is_active) {
                return ['success' => false, 'status_code' => 422, 'message' => 'Authorized user is disabled for this credit account.', 'data' => ['account' => $account, 'authorized_user' => $authorizedUser, 'available_limit' => $available]];
            }
        }

        if ($available <= 0) {
            return ['success' => false, 'status_code' => 422, 'message' => 'Credit account available balance is empty. Ask account holder to request additional credit limit.', 'data' => ['account' => $account, 'authorized_user' => $authorizedUser, 'available_limit' => $available]];
        }

        return [
            'success' => true,
            'message' => 'Credit card validated successfully.',
            'data' => [
                'account' => $account,
                'authorized_user' => $authorizedUser,
                'credit_account_id' => $account->id,
                'credit_account_user_id' => $authorizedUser?->id,
                'available_limit' => $available,
                'is_organization' => $isOrganization,
                'is_active' => true,
            ],
        ];
    }

    private function parseCard(string $value): array
    {
        $text = trim($value);
        $accountId = null;
        $authorizedUserId = null;

        if (preg_match('/credit-account\s*:\s*([^;\s]+)/i', $text, $match)) {
            $accountId = $match[1];
        }
        if (preg_match('/authorized-user\s*:\s*([^;\s]+)/i', $text, $match)) {
            $authorizedUserId = $match[1];
        }
        if (!$accountId && preg_match('/owner\s*:\s*([^;\s]+)/i', $text, $match)) {
            $accountId = $match[1];
        }
        if (!$accountId && str_starts_with(strtoupper($text), 'CR-')) {
            $digits = preg_replace('/\D+/', '', $text);
            $accountId = $digits ? (int) ltrim($digits, '0') : null;
        }

        return [
            'credit_account_id' => $accountId ? (int) $accountId : null,
            'authorized_user_id' => $authorizedUserId ? (int) $authorizedUserId : null,
        ];
    }

    private function calculateTotal(array $items): float
    {
        $subtotal = 0;
        foreach ($items as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);
            if (!$menuItem->is_active || !$menuItem->is_available) {
                throw new RuntimeException("Item {$menuItem->name} is not available");
            }
            $subtotal += ((float) $menuItem->price) * ((int) $item['quantity']);
        }
        $tax = round($subtotal * 0.10, 2);
        $serviceCharge = round($subtotal * 0.05, 2);
        return round($subtotal + $tax + $serviceCharge, 2);
    }

    private function estimatePreparationMinutes(Order $order): int
    {
        $hasFood = $order->items->contains('station', 'kitchen');
        $hasDrink = $order->items->contains('station', 'bar');
        return ($hasFood ? 15 : 0) + ($hasDrink ? 5 : 0);
    }
}
