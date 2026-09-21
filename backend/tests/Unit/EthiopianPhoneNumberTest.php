<?php

namespace Tests\Unit;

use App\Support\EthiopianPhoneNumber;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class EthiopianPhoneNumberTest extends TestCase
{
    #[DataProvider('phoneNumbers')]
    public function test_it_normalizes_ethiopian_mobile_numbers(?string $input, ?string $expected): void
    {
        $this->assertSame($expected, EthiopianPhoneNumber::normalize($input));
    }

    public static function phoneNumbers(): array
    {
        return [
            'local format' => ['0911234567', '+251911234567'],
            'local format with spaces' => ['091 123 4567', '+251911234567'],
            'country code without plus' => ['251911234567', '+251911234567'],
            'canonical format' => ['+251911234567', '+251911234567'],
            'canonical with separators' => ['+251 911-234-567', '+251911234567'],
            'foreign number is preserved' => ['+12025550123', '+12025550123'],
            'incomplete value is preserved' => ['0911', '0911'],
            'null is preserved' => [null, null],
        ];
    }
}
