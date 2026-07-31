<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class AssetAssignment extends Model
{
    protected $fillable = [
        'asset_id',
        'assigned_to_employee_id',
        'assigned_at',
        'returned_at',
        'return_condition',
        'notes',
        'assignment_document_path',
        'assignment_condition_image_path',
        'return_document_path',
        'return_condition_image_path',
        'assigned_by_user_id',
        'returned_by_user_id',
    ];

    protected $appends = [
        'assignment_document_url',
        'assignment_condition_image_url',
        'return_document_url',
        'return_condition_image_url',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    public function getAssignmentDocumentUrlAttribute(): ?string
    {
        return $this->publicUrl($this->assignment_document_path);
    }

    public function getAssignmentConditionImageUrlAttribute(): ?string
    {
        return $this->publicUrl($this->assignment_condition_image_path);
    }

    public function getReturnDocumentUrlAttribute(): ?string
    {
        return $this->publicUrl($this->return_document_path);
    }

    public function getReturnConditionImageUrlAttribute(): ?string
    {
        return $this->publicUrl($this->return_condition_image_path);
    }

    private function publicUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }

    /**
     * Get the asset that was assigned
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the employee the asset was assigned to
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_to_employee_id');
    }

    /**
     * Get the user who assigned the asset
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    /**
     * Get the user who processed the return
     */
    public function returnedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by_user_id');
    }

    /**
     * Scope to get only active assignments
     */
    public function scopeActive($query)
    {
        return $query->whereNull('returned_at');
    }

    /**
     * Scope to get only returned assignments
     */
    public function scopeReturned($query)
    {
        return $query->whereNotNull('returned_at');
    }
}
