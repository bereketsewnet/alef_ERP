<?php

namespace App\Support;

/**
 * Produces a forgiving, ASCII phonetic representation of Ethiopic names.
 *
 * This is intentionally limited to employee-name search. It is not intended
 * to be a formal transliteration or to modify the name stored by the user.
 */
class EmployeeNameSearch
{
    /** @var array<int, array{0: string, 1?: string}> */
    private const SYLLABLE_GROUPS = [
        0x1200 => ['h', 'a'],  // ሀ
        0x1208 => ['l'],       // ለ
        0x1210 => ['h', 'a'],  // ሐ
        0x1218 => ['m'],       // መ
        0x1220 => ['s'],       // ሠ
        0x1228 => ['r'],       // ረ
        0x1230 => ['s'],       // ሰ
        0x1238 => ['sh'],      // ሸ
        0x1240 => ['k'],       // ቀ (q/k are normalized together)
        0x1250 => ['k'],       // ቐ
        0x1260 => ['b'],       // በ
        0x1268 => ['v'],       // ቨ
        0x1270 => ['t'],       // ተ
        0x1278 => ['ch'],      // ቸ
        0x1280 => ['h', 'a'],  // ኀ
        0x1290 => ['n'],       // ነ
        0x1298 => ['ny'],      // ኘ
        0x12A0 => ['', 'a'],   // አ
        0x12A8 => ['k'],       // ከ
        0x12B8 => ['h', 'a'],  // ኸ
        0x12C8 => ['w'],       // ወ
        0x12D0 => ['', 'a'],   // ዐ
        0x12D8 => ['z'],       // ዘ
        0x12E0 => ['zh'],      // ዠ
        0x12E8 => ['y'],       // የ
        0x12F0 => ['d'],       // ደ
        0x12F8 => ['d'],       // ዸ
        0x1300 => ['j'],       // ጀ
        0x1308 => ['g'],       // ገ
        0x1318 => ['g'],       // ጘ
        0x1320 => ['t'],       // ጠ
        0x1328 => ['ch'],      // ጨ
        0x1330 => ['p'],       // ጰ
        0x1338 => ['ts'],      // ጸ
        0x1340 => ['ts'],      // ፀ
        0x1348 => ['f'],       // ፈ
        0x1350 => ['p'],       // ፐ
    ];

    /** @var array<int, string> */
    private const LABIALIZED_GROUPS = [
        0x1248 => 'k',
        0x1258 => 'k',
        0x1288 => 'h',
        0x12B0 => 'k',
        0x12C0 => 'h',
        0x1310 => 'g',
    ];

    public static function aliases(?string $firstName, ?string $lastName): string
    {
        $fullName = trim(implode(' ', array_filter([$firstName, $lastName], fn ($value) => filled($value))));
        $phonetic = self::normalize($fullName);

        if ($phonetic === '') {
            return '';
        }

        $aliases = [$phonetic];
        $withoutSpaces = str_replace(' ', '', $phonetic);
        if ($withoutSpaces !== $phonetic) {
            $aliases[] = $withoutSpaces;
        }

        return implode(' ', array_unique($aliases));
    }

    public static function normalize(?string $value): string
    {
        if (!filled($value)) {
            return '';
        }

        $value = self::transliterate(mb_strtolower(trim((string) $value), 'UTF-8'));
        $value = strtr($value, [
            'ä' => 'e', 'ə' => 'e', 'é' => 'e', 'è' => 'e',
            'ā' => 'a', 'ī' => 'i', 'ū' => 'u', 'ō' => 'o',
            'ph' => 'f', 'q' => 'k',
            // Common Ethiopian name spellings: Haile/Hayle, Seid/Seyd.
            'ai' => 'y', 'ay' => 'y', 'ei' => 'y', 'ey' => 'y',
        ]);
        $value = preg_replace('/([a-z])\1+/u', '$1', $value) ?? $value;
        $value = preg_replace('/[^a-z0-9]+/u', ' ', $value) ?? $value;

        return trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
    }

    private static function transliterate(string $value): string
    {
        $result = '';

        foreach (mb_str_split($value) as $character) {
            $codePoint = mb_ord($character, 'UTF-8');
            $matched = false;

            foreach (self::SYLLABLE_GROUPS as $base => $group) {
                $offset = $codePoint - $base;
                if ($offset < 0 || $offset > 6) {
                    continue;
                }

                $consonant = $group[0];
                $firstVowel = $group[1] ?? 'e';
                $vowels = $consonant === ''
                    ? [$firstVowel, 'u', 'i', 'a', 'e', 'e', 'o']
                    : [$firstVowel, 'u', 'i', 'a', 'e', '', 'o'];
                $result .= $consonant . $vowels[$offset];
                $matched = true;
                break;
            }

            if ($matched) {
                continue;
            }

            foreach (self::LABIALIZED_GROUPS as $base => $consonant) {
                $offset = $codePoint - $base;
                $vowels = [0 => 'wa', 2 => 'wi', 3 => 'wa', 4 => 'we', 5 => 'w'];
                if (!array_key_exists($offset, $vowels)) {
                    continue;
                }

                $result .= $consonant . $vowels[$offset];
                $matched = true;
                break;
            }

            if (!$matched) {
                $result .= $character;
            }
        }

        return $result;
    }
}
