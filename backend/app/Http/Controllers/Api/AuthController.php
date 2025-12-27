<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TelegramAuthService;
use App\Models\User;
use OpenApi\Annotations as OA;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    private TelegramAuthService $telegramAuthService;

    public function __construct(TelegramAuthService $telegramAuthService)
    {
        $this->telegramAuthService = $telegramAuthService;
    }

    /**
     * @OA\Post(
     *     path="/auth/login",
     *     summary="Login with username, email, or phone",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"login", "password"},
     *             @OA\Property(property="login", type="string", description="Username, Email, or Phone Number"),
     *             @OA\Property(property="password", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Successful login",
     *         @OA\JsonContent(
     *             @OA\Property(property="access_token", type="string"),
     *             @OA\Property(property="token_type", type="string", example="bearer"),
     *             @OA\Property(property="user", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Invalid credentials")
     * )
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'login' => 'required|string',
                'password' => 'required|string',
            ]);

            // Determine login type: email, phone_number, or username
            $login = trim($request->login);
            $loginType = 'username'; // default
            $actualLoginValue = $login; // Value to use for authentication
            
            // Check if it's an email
            if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
                $loginType = 'email';
            }
            // Check if it's a phone number (contains digits and possibly +, spaces, dashes)
            elseif (preg_match('/^[\+]?[\d\s\-\(\)]+$/', $login) && strlen(preg_replace('/\D/', '', $login)) >= 7) {
                $loginType = 'phone_number';
                // Normalize phone number: remove spaces, dashes, parentheses for comparison
                $normalizedPhone = preg_replace('/\D/', '', $login);
                
                // Try to find user with matching phone number
                // First try exact match
                $user = User::where('phone_number', $login)->first();
                
                // If not found, try normalized match
                if (!$user) {
                    $user = User::whereRaw('REPLACE(REPLACE(REPLACE(REPLACE(phone_number, " ", ""), "-", ""), "(", ""), ")", "") = ?', [$normalizedPhone])->first();
                }
                
                // If still not found, try matching last 9 digits (local number)
                if (!$user && strlen($normalizedPhone) >= 9) {
                    $last9 = substr($normalizedPhone, -9);
                    $user = User::whereRaw('REPLACE(REPLACE(REPLACE(REPLACE(phone_number, " ", ""), "-", ""), "(", ""), ")", "") LIKE ?', ['%' . $last9])->first();
                }
                
                if ($user) {
                    // Use the exact phone_number from database for JWT authentication
                    $actualLoginValue = $user->phone_number;
                } else {
                    // Phone number not found, return invalid credentials
                    return response()->json(['error' => 'Invalid credentials'], 401);
                }
            }

            $credentials = [
                $loginType => $actualLoginValue,
                'password' => $request->password,
            ];

            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'Invalid credentials'], 401);
            }

            $user = auth()->user();

            if (!$user->is_active) {
                JWTAuth::invalidate($token);
                return response()->json(['error' => 'Account is inactive'], 403);
            }

            // Update last login
            $user->update(['last_login' => now()]);

            return $this->respondWithToken($token, $user);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/auth/register",
     *     summary="Register a new user",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"username", "email", "password", "phone_number"},
     *             @OA\Property(property="username", type="string"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="phone_number", type="string"),
     *             @OA\Property(property="password", type="string", minLength=6),
     *             @OA\Property(property="password_confirmation", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="User registered successfully")
     * )
     */
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:users',
            'email' => 'required|string|email|unique:users',
            'phone_number' => 'required|string|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'role' => 'FIELD_STAFF', // Default role
            'is_active' => true,
        ]);

        $token = JWTAuth::fromUser($user);

        return $this->respondWithToken($token, $user);
    }

    /**
     * @OA\Put(
     *     path="/auth/profile",
     *     summary="Update user profile",
     *     tags={"Authentication"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="phone_number", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Profile updated")
     * )
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone_number' => 'sometimes|string|unique:users,phone_number,' . $user->id,
        ]);

        $user->update($request->only(['email', 'phone_number']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    /**
     * @OA\Post(
     *     path="/auth/change-password",
     *     summary="Change password",
     *     tags={"Authentication"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"current_password", "new_password"},
     *             @OA\Property(property="current_password", type="string"),
     *             @OA\Property(property="new_password", type="string", minLength=6),
     *             @OA\Property(property="new_password_confirmation", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Password changed successfully")
     * )
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Current password does not match'], 400);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    protected function respondWithToken($token, $user)
    {
        // Load employee relationship if not loaded
        if (!$user->relationLoaded('employee')) {
            $user->load('employee');
        }

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => $user,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/auth/telegram",
     *     summary="Login via Telegram Mini App",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"initData"},
     *             @OA\Property(property="initData", type="string", description="Raw initData string from Telegram")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Successful login",
     *         @OA\JsonContent(
     *             @OA\Property(property="access_token", type="string"),
     *             @OA\Property(property="token_type", type="string", example="bearer"),
     *             @OA\Property(property="user", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Invalid Telegram data")
     * )
     */
    public function telegramLogin(Request $request)
    {
        $request->validate([
            'initData' => 'required|string',
        ]);

        try {
            $telegramUser = $this->telegramAuthService->validateInitData($request->initData);

            if (!$telegramUser) {
                return response()->json(['error' => 'Invalid Telegram data'], 401);
            }

            $user = $this->telegramAuthService->findOrCreateUser($telegramUser);

            if (!$user->is_active) {
                return response()->json(['error' => 'Account is inactive'], 403);
            }

            $token = JWTAuth::fromUser($user);

            return $this->respondWithToken($token, $user);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Authentication failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Refresh JWT token
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());

            return response()->json([
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Could not refresh token'], 401);
        }
    }

    /**
     * Get authenticated user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 401);
            }
            $user->load('employee');
            return response()->json(['user' => $user]);
        } catch (\Exception $e) {
            \Log::error('Me error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Logout (invalidate token)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['message' => 'Successfully logged out']);
    }
}
