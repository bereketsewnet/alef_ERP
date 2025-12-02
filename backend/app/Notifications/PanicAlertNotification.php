<?php

namespace App\Notifications;

use App\Models\OperationalReport;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PanicAlertNotification extends Notification
{
    use Queueable;

    public $report;

    public function __construct(OperationalReport $report)
    {
        $this->report = $report;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->subject('🚨 PANIC ALERT - Immediate Action Required')
                    ->greeting('URGENT: Panic Button Activated')
                    ->line('A panic alert has been triggered by ' . $this->report->reportedBy->first_name . ' ' . $this->report->reportedBy->last_name)
                    ->line('**Site:** ' . $this->report->site->site_name)
                    ->line('**Time:** ' . $this->report->created_at->format('M d, Y H:i:s'))
                    ->line('**Description:** ' . $this->report->description)
                    ->action('View Report', url('/incidents/' . $this->report->id))
                    ->line('Please take immediate action.');
    }
}
