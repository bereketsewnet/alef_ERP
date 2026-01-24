# Mail Configuration for Invoice Sending

## Environment Variables

Add these to your `.env` file in the backend directory:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=bekwork65@gmail.com
MAIL_PASSWORD=your_app_password_here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=bekwork65@gmail.com
MAIL_FROM_NAME="Alef ERP"
```

## Gmail Setup

1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `MAIL_PASSWORD`

## Testing

After configuration, test by sending an invoice from the Billing & Invoices page.

