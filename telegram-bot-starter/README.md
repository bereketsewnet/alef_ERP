# ALEF DELTA ERP - Telegram Bot Starter

Node.js Telegram bot for the ALEF DELTA ERP Mini App.

## Features

- `/start` - Welcome message and open Mini App
- `/help` - Show available commands
- `/roster` - Quick access to roster view
- `/clockin` - Quick clock-in with location sharing
- Webhook support for production deployment

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
BOT_TOKEN=your_bot_token_from_botfather
MINI_APP_URL=https://your-mini-app-url.com
BACKEND_API_URL=https://your-backend-api.com/api
PORT=3000
```

### 3. Get Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token and add it to `.env`

### 4. Setup Mini App

1. Send `/newapp` to BotFather
2. Select your bot
3. Provide app title, description, and URL
4. Upload an icon (640x360 pixels)
5. Copy the Mini App URL and add it to `.env`

### 5. Run the Bot

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

## Production Deployment (VPS)

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start index.js --name alef-erp-bot

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
```

### Using Systemd

Create `/etc/systemd/system/alef-erp-bot.service`:

```ini
[Unit]
Description=ALEF DELTA ERP Telegram Bot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/telegram-bot-starter
ExecStart=/usr/bin/node index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable alef-erp-bot
sudo systemctl start alef-erp-bot
sudo systemctl status alef-erp-bot
```

## Webhook Setup (Optional)

For production, you can use webhooks instead of polling:

1. Setup HTTPS endpoint (required by Telegram)
2. Set webhook URL:

```javascript
const WEBHOOK_URL = 'https://yourdomain.com/webhook';
bot.setWebHook(WEBHOOK_URL);
```

3. Remove polling:

```javascript
// Remove: { polling: true }
const bot = new TelegramBot(BOT_TOKEN);
```

## Integration with Laravel Backend

The bot can make requests to the Laravel API:

```javascript
const axios = require('axios');

// Example: Fetch user roster
const response = await axios.get(`${BACKEND_API_URL}/roster/my-roster`, {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and open Mini App |
| `/help` | Show help message |
| `/roster` | View upcoming shifts |
| `/clockin` | Clock in with location |

## File Structure

```
telegram-bot-starter/
├── index.js          # Main bot file
├── package.json      # Dependencies
├── .env.example      # Environment template
└── README.md         # This file
```

## Troubleshooting

### Bot not responding

- Check bot token in `.env`
- Ensure bot is running (`pm2 status`)
- Check logs (`pm2 logs alef-erp-bot`)

### Mini App not opening

- Verify MINI_APP_URL in `.env`
- Ensure HTTPS is enabled on Mini App URL
- Check domain is accessible

### API requests failing

- Check BACKEND_API_URL in `.env`
- Verify API is running and accessible
- Check authentication tokens

## License

Proprietary - ALEF DELTA
