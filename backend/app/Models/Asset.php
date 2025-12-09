<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'asset_code',
        'name',
        'category',
        'condition',
        'purchase_date',
        'value',
        'description',
        'status',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'value' => 'decimal:2',
    ];

    protected $appends = ['current_assignment_status'];

    /**
     * Get all assignments for this asset
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class);
    }

    /**
     * Get the current (active) assignment
     */
    public function currentAssignment(): HasOne
    {
        return $this->hasOne(AssetAssignment::class)
            ->whereNull('returned_at')
            ->latestOfMany();
    }

    /**
     * Get the latest assignment (returned or not)
     */
    public function latestAssignment(): HasOne
    {
        return $this->hasOne(AssetAssignment::class)->latestOfMany();
    }

    /**
     * Scope to get available assets
     */
    public function scopeAvailable($query)
    {
        return $query->where('condition', '!=', 'LOST')
            ->whereDoesntHave('currentAssignment');
    }

    /**
     * Scope to get assigned assets
     */
    public function scopeAssigned($query)
    {
        return $query->whereHas('currentAssignment');
    }

    /**
     * Scope to filter by category
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to filter by condition
     */
    public function scopeCondition($query, $condition)
    {
        return $query->where('condition', $condition);
    }

    /**
     * Scope to search assets
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('asset_code', 'LIKE', "%{$search}%")
                ->orWhere('name', 'LIKE', "%{$search}%")
                ->orWhere('category', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Get the assignment status attribute
     */
    public function getCurrentAssignmentStatusAttribute()
    {
        if ($this->currentAssignment) {
            return 'assigned';
        }
        
        if ($this->condition === 'DAMAGED') {
            return 'maintenance';
        }
        
        if ($this->condition === 'LOST') {
            return 'retired';
        }
        
        return 'available';
    }
}
