<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * Telegram Authentication Service
 * 
 * Validates Telegram Mini App initData and authenticates users
 * Based on Telegram's official authentication documentation
 */
class TelegramAuthService
{
    private string $botToken;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token');
    }

    /**
     * Validate Telegram initData and extract user information
     *
     * @param string $initData Raw initData string from Telegram Mini App
     * @return array|null Returns user data if valid, null if invalid
     */
    public function validateInitData(string $initData): ?array
    {
        if (empty($this->botToken)) {
            throw new \Exception('Telegram bot token not configured');
        }

        // Parse initData
        parse_str($initData, $data);

        if (!isset($data['hash'])) {
            return null;
        }

        $hash = $data['hash'];
        unset($data['hash']);

        // Create data-check-string
        $dataCheckArr = [];
        foreach ($data as $key => $value) {
            $dataCheckArr[] = $key . '=' . $value;
        }
        sort($dataCheckArr);
        $dataCheckString = implode("\n", $dataCheckArr);

        // Calculate secret key
        $secretKey = hash_hmac('sha256', $this->botToken, 'WebAppData', true);

        // Calculate hash
        $calculatedHash = hash_hmac('sha256', $dataCheckString, $secretKey);

        // Verify hash
        if (!hash_equals($calculatedHash, $hash)) {
            return null;
        }

        // Parse user data
        if (isset($data['user'])) {
            $userData = json_decode($data['user'], true);
            return $userData;
        }

        return null;
    }

    /**
     * Find or create user from Telegram data
     *
     * @param array $telegramUser Telegram user data
     * @return User
     */
    public function findOrCreateUser(array $telegramUser): User
    {
        $chatId = $telegramUser['id'];

        $user = User::where('telegram_chat_id', $chatId)->first();

        if (!$user) {
            // Create new user
            $user = User::create([
                'telegram_chat_id' => $chatId,
                'username' => $telegramUser['username'] ?? 'user_' . $chatId,
                'email' => $telegramUser['username'] ? $telegramUser['username'] . '@telegram.user' : 'user_' . $chatId . '@telegram.user',
                'role' => 'FIELD_STAFF',
                'is_active' => true,
            ]);
        }

        // Update last login
        $user->update(['last_login' => now()]);

        return $user;
    }
}
