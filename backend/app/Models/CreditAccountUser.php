<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditAccountUser extends Model
{
    protected $fillable = [
        'credit_account_id',
        'full_name',
        'phone',
        'employee_id',
        'position',
        'id_number',
        'daily_limit',
        'monthly_limit',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'daily_limit' => 'decimal:2',
        'monthly_limit' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function account()
    {
        return $this->belongsTo(CreditAccount::class, 'credit_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function creditOrders()
    {
        return $this->hasMany(CreditOrder::class, 'credit_account_user_id');
    }
}
