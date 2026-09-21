<?php

namespace App\Support;

/**
 * Canonicalizes Ethiopian mobile numbers without changing foreign or
 * incomplete numbers. The stored format is +2519XXXXXXXX.
 */
class EthiopianPhoneNumber
{
    public static function normalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return $trimmed;
        }

        $compact = preg_replace('/[\s\-()]+/', '', $trimmed) ?? $trimmed;

        if (preg_match('/^09\d{8}$/', $compact) === 1) {
            return '+251' . substr($compact, 1);
        }

        if (preg_match('/^2519\d{8}$/', $compact) === 1) {
            return '+' . $compact;
        }

        if (preg_match('/^\+2519\d{8}$/', $compact) === 1) {
            return $compact;
        }

        return $trimmed;
    }
}
