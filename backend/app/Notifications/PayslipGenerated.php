<?php

namespace App\Notifications;

use App\Models\Payslip;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PayslipGenerated extends Notification
{
    use Queueable;

    public $payslip;

    public function __construct(Payslip $payslip)
    {
        $this->payslip = $payslip;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->subject('Your Payslip is Ready')
                    ->greeting('Hello ' . $this->payslip->employee->first_name . '!')
                    ->line('Your payslip for the period ' . $this->payslip->payrollPeriod->start_date->format('M d') . ' - ' . $this->payslip->payrollPeriod->end_date->format('M d, Y') . ' is now available.')
                    ->line('**Net Pay:** ' . number_format($this->payslip->net_pay, 2) . ' ETB')
                    ->action('View Payslip', url('/api/finance/payslips/' . $this->payslip->id . '/download'))
                    ->line('Thank you for your hard work!');
   }
}
