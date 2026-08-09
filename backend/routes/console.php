<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;
use App\Models\Contract;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('crm:send-contract-reminders', function () {
    $contracts = Contract::with('client')->where('status', 'ACTIVE')->whereNull('archived_at')
        ->whereDate('end_date', '>=', today())
        ->whereRaw('DATEDIFF(end_date, CURDATE()) <= expiry_reminder_days')
        ->where(fn ($q) => $q->whereNull('reminder_sent_at')->orWhere('reminder_sent_at', '<=', now()->subDays(7)))
        ->get();

    foreach ($contracts as $contract) {
        $email = $contract->reminder_email ?: $contract->client?->email;
        if (!$email) continue;
        // Reserved example addresses are used by CrmDemoSeeder and must never receive real mail.
        if (str_ends_with(strtolower($email), '@example.com')) continue;
        try {
            Mail::raw("URGENT CONTRACT REMINDER\n\nClient: {$contract->client?->company_name}\nContract: {$contract->title}\nReference: {$contract->reference_number}\nExpiry: {$contract->end_date->toDateString()}\nDays remaining: {$contract->days_remaining}\n\nPlease review renewal, payment, or termination action in ALEF DELTA ERP CRM.", function ($message) use ($email, $contract) {
                $message->to($email)->subject("Contract expiry reminder: {$contract->title} ({$contract->days_remaining} days)");
            });
            $contract->update(['reminder_sent_at' => now()]);
            $this->info("Reminder sent for contract {$contract->id} to {$email}");
        } catch (\Throwable $e) {
            report($e); $this->error("Contract {$contract->id}: {$e->getMessage()}");
        }
    }
})->purpose('Email reminders for contracts approaching expiry');

Schedule::command('crm:send-contract-reminders')->dailyAt('07:00')->timezone('Africa/Addis_Ababa')->withoutOverlapping();
