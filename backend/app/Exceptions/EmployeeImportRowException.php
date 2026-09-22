<?php

namespace App\Exceptions;

use RuntimeException;

class EmployeeImportRowException extends RuntimeException
{
    /**
     * @param array<int, array{column:string,value:mixed,message:string}> $errors
     */
    public function __construct(public readonly array $errors)
    {
        parent::__construct(implode(' ', array_column($errors, 'message')));
    }

    public static function forColumn(string $column, mixed $value, string $message): self
    {
        return new self([[
            'column' => $column,
            'value' => $value,
            'message' => $message,
        ]]);
    }
}
