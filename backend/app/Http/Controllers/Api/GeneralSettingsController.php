<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollSetting;
use Illuminate\Http\Request;

/**
 * General application settings (non-payroll).
 * Stored in the payroll_settings table under dedicated keys.
 */
class GeneralSettingsController extends Controller
{
    // Valid attendance mode values
    private const ATTENDANCE_MODE_KEY = 'attendance_mode';
    private const VALID_MODES = ['MANUAL', 'MIXED', 'GPS'];
    private const DEFAULT_MODE = 'MANUAL';

    /**
     * GET /settings/attendance-mode
     * Accessible to all authenticated admin-panel users (for reading).
     */
    public function getAttendanceMode()
    {
        $value = PayrollSetting::get(self::ATTENDANCE_MODE_KEY, self::DEFAULT_MODE);

        // setting_value is auto-cast to JSON; handle both string and array cases
        $mode = is_array($value) ? ($value['mode'] ?? self::DEFAULT_MODE) : (string) $value;

        if (!in_array($mode, self::VALID_MODES, true)) {
            $mode = self::DEFAULT_MODE;
        }

        return response()->json([
            'key'   => self::ATTENDANCE_MODE_KEY,
            'mode'  => $mode,
        ]);
    }

    /**
     * PUT /settings/attendance-mode
     * OWNER only.
     */
    public function setAttendanceMode(Request $request)
    {
        $role = auth()->user()->role ?? null;
        if ($role !== 'OWNER') {
            return response()->json(['error' => 'Only OWNER can change attendance mode'], 403);
        }

        $request->validate([
            'mode' => 'required|in:MANUAL,MIXED,GPS',
        ]);

        // Deactivate previous value
        PayrollSetting::where('setting_key', self::ATTENDANCE_MODE_KEY)->update(['is_active' => false]);

        // Create new active version
        PayrollSetting::create([
            'setting_key'        => self::ATTENDANCE_MODE_KEY,
            'setting_value'      => $request->mode,
            'setting_type'       => 'string',
            'description'        => 'Attendance entry mode: MANUAL | MIXED | GPS',
            'effective_from'     => now(),
            'is_active'          => true,
            'created_by_user_id' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Attendance mode updated successfully',
            'mode'    => $request->mode,
        ]);
    }
}
