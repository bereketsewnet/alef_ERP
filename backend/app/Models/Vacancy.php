<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vacancy extends Model
{
    use HasFactory;

    protected $fillable = [
        'title_en',
        'title_am',
        'description',
        'qualification',
        'more_info',
        'number_of_employees',
        'is_active',
    ];

    protected $casts = [
        'number_of_employees' => 'integer',
        'is_active' => 'boolean',
    ];
}
