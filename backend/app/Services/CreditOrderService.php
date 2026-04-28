<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\CreditAccount;
use App\Models\CreditApprovalLog;
use App\Models\CreditOrder;
use App\Models\CreditSettlement;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CreditOrderService
{
    public function createForBill(Bill $bill, int $creditAccountId, int $userId, ?string $dueDate = null, ?string $notes = null, bool $overrideLimit = false): CreditOrder
    {
        return DB::transaction(function () use ($bill, $creditAccountId, $userId, $dueDate, $notes, $overrideLimit) {
            $bill = Bill::with('order')->lockForUpdate()->findOrFail($bill->id);
            $account = CreditAccount::lockForUpdate()->findOrFail($creditAccountId);

            if (!$account->is_credit_enabled || $account->status !== 'active') {
                throw new RuntimeException('Credit account is not active or credit is disabled.');
            }

            $total = round((float) $bill->total, 2);
            $available = round((float) $account->credit_limit - (float) $account->current_balance, 2);

            if (!$overrideLimit && $total > $available) {
                throw new RuntimeException('Credit limit exceeded. Choose another credit account or reduce the order amount.');
            }

            $status = $account->requires_approval ? 'credit_pending' : 'credit_approved';
            $creditOrder = CreditOrder::create([
                'order_id' => $bill->order_id,
                'bill_id' => $bill->id,
                'credit_account_id' => $account->id,
                'credit_reference' => $this->reference(),
                'total_amount' => $total,
                'paid_amount' => 0,
                'remaining_amount' => $total,
                'status' => $status,
                'approved_by' => $status === 'credit_approved' ? $userId : null,
                'approved_at' => $status === 'credit_approved' ? now() : null,
                'due_date' => $this->calculateDueDateFromAccount($account),
                'notes' => $notes,
            ]);

            $account->current_balance = round((float) $account->current_balance + $total, 2);
            $account->save();

            $bill->update([
                'bill_type' => 'credit',
                'credit_status' => $status,
                'status' => 'issued',
                'due_date' => $creditOrder->due_date,
                'issued_by' => $bill->issued_by ?: $userId,
                'issued_at' => $bill->issued_at ?: now(),
            ]);

            $bill->order?->update([
                'payment_type' => 'credit',
                'credit_status' => $status,
                'credit_account_id' => $account->id,
            ]);

            CreditApprovalLog::create([
                'credit_order_id' => $creditOrder->id,
                'action' => $status === 'credit_approved' ? ($overrideLimit ? 'overridden' : 'approved') : 'requested',
                'actor_id' => $userId,
                'note' => $notes,
            ]);

            return $creditOrder->fresh(['account','order','bill','logs']);
        });
    }

    private function calculateDueDateFromAccount(CreditAccount $account)
    {
        return match ((string) ($account->settlement_cycle ?? 'monthly')) {
            'daily' => now()->addDay(),
            'weekly' => now()->addWeek(),
            default => now()->addMonth(),
        };
    }

    public function approve(CreditOrder $creditOrder, int $userId, ?string $note = null): CreditOrder
    {
        return DB::transaction(function () use ($creditOrder, $userId, $note) {
            $creditOrder = CreditOrder::lockForUpdate()->findOrFail($creditOrder->id);
            if (!in_array($creditOrder->status, ['credit_pending','blocked'], true)) {
                throw new RuntimeException('Only pending or blocked credit orders can be approved.');
            }
            $creditOrder->update(['status' => 'credit_approved', 'approved_by' => $userId, 'approved_at' => now()]);
            $creditOrder->bill?->update(['credit_status' => 'credit_approved']);
            $creditOrder->order?->update(['credit_status' => 'credit_approved']);
            CreditApprovalLog::create(['credit_order_id' => $creditOrder->id, 'action' => 'approved', 'actor_id' => $userId, 'note' => $note]);
            return $creditOrder->fresh(['account','order','bill','logs']);
        });
    }

    public function reject(CreditOrder $creditOrder, int $userId, ?string $note = null): CreditOrder
    {
        return DB::transaction(function () use ($creditOrder, $userId, $note) {
            $creditOrder = CreditOrder::with('account')->lockForUpdate()->findOrFail($creditOrder->id);
            if ($creditOrder->status === 'fully_settled') {
                throw new RuntimeException('Fully settled credit orders cannot be rejected.');
            }
            $amount = (float) $creditOrder->remaining_amount;
            $creditOrder->account->current_balance = max(0, round((float) $creditOrder->account->current_balance - $amount, 2));
            $creditOrder->account->save();
            $creditOrder->update(['status' => 'blocked']);
            $creditOrder->bill?->update(['credit_status' => 'blocked']);
            $creditOrder->order?->update(['credit_status' => 'blocked']);
            CreditApprovalLog::create(['credit_order_id' => $creditOrder->id, 'action' => 'blocked', 'actor_id' => $userId, 'note' => $note]);
            return $creditOrder->fresh(['account','order','bill','logs']);
        });
    }

    public function settle(CreditOrder $creditOrder, array $data, int $userId): CreditOrder
    {
        return DB::transaction(function () use ($creditOrder, $data, $userId) {
            $creditOrder = CreditOrder::with(['account','bill'])->lockForUpdate()->findOrFail($creditOrder->id);
            if (!in_array($creditOrder->status, ['credit_approved','partially_settled','overdue'], true)) {
                throw new RuntimeException('Only approved, overdue, or partially settled credit orders can be settled.');
            }
            $amount = round((float) $data['amount'], 2);
            if ($amount <= 0 || $amount > round((float) $creditOrder->remaining_amount, 2)) {
                throw new RuntimeException('Settlement amount is invalid or exceeds remaining balance.');
            }
            CreditSettlement::create([
                'credit_order_id' => $creditOrder->id,
                'amount' => $amount,
                'payment_method' => $data['payment_method'],
                'reference_number' => $data['reference_number'] ?? null,
                'received_by' => $userId,
                'settled_at' => $data['settled_at'] ?? now(),
                'notes' => $data['notes'] ?? null,
            ]);
            $creditOrder->paid_amount = round((float) $creditOrder->paid_amount + $amount, 2);
            $creditOrder->remaining_amount = max(0, round((float) $creditOrder->total_amount - (float) $creditOrder->paid_amount, 2));
            $creditOrder->status = $creditOrder->remaining_amount <= 0 ? 'fully_settled' : 'partially_settled';
            $creditOrder->save();
            $creditOrder->account->current_balance = max(0, round((float) $creditOrder->account->current_balance - $amount, 2));
            $creditOrder->account->save();
            $creditOrder->bill->paid_amount = round((float) $creditOrder->bill->paid_amount + $amount, 2);
            $creditOrder->bill->balance = max(0, round((float) $creditOrder->bill->total - (float) $creditOrder->bill->paid_amount, 2));
            $creditOrder->bill->credit_status = $creditOrder->status;
            $creditOrder->bill->status = $creditOrder->bill->balance <= 0 ? 'paid' : 'partial';
            if ($creditOrder->bill->balance <= 0) $creditOrder->bill->paid_at = now();
            $creditOrder->bill->save();
            $creditOrder->order?->update(['credit_status' => $creditOrder->status]);
            CreditApprovalLog::create(['credit_order_id' => $creditOrder->id, 'action' => 'settled', 'actor_id' => $userId, 'note' => $data['notes'] ?? null]);
            return $creditOrder->fresh(['account','order','bill','settlements.receiver','logs']);
        });
    }

    private function reference(): string
    {
        do { $ref = 'CR-' . now()->format('Ymd') . '-' . str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT); }
        while (CreditOrder::where('credit_reference', $ref)->exists());
        return $ref;
    }
}
