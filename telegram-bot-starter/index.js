const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL;
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000/api';
const PORT = process.env.PORT || 3000;

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Initialize Express for webhook (optional)
const app = express();
app.use(express.json());

// Bot Commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;

  bot.sendMessage(chatId, `Welcome to ALEF DELTA ERP, ${firstName}! 👋\n\nUse the menu button below to access the app.`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 Open App',
            web_app: { url: MINI_APP_URL }
          }
        ]
      ]
    }
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    `*ALEF DELTA ERP Bot Commands:*\n\n` +
    `/start - Start the bot and open the app\n` +
    `/help - Show this help message\n` +
    `/roster - View your upcoming shifts\n` +
    `/clockin - Quick clock in (requires location)\n\n` +
    `Tap the menu button to access the full app!`,
    { parse_mode: 'Markdown' }
  );
});

// Quick roster command
bot.onText(/\/roster/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from.id;

  try {
    // This would require the user to be authenticated
    // For now, just open the Mini App
    bot.sendMessage(chatId, 'Opening your roster...', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📅 View Roster',
              web_app: { url: `${MINI_APP_URL}/roster` }
            }
          ]
        ]
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, 'Failed to fetch roster. Please open the app.');
  }
});

// Quick clock in (with location)
bot.onText(/\/clockin/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Please share your location to clock in:', {
    reply_markup: {
      keyboard: [
        [
          {
            text: '📍 Share Location',
            request_location: true
          }
        ],
        ['❌ Cancel']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// Handle location sharing
bot.on('location', async (msg) => {
  const chatId = msg.chat.id;
  const location = msg.location;

  // In a real implementation, you would:
  // 1. Get the user's auth token (stored in a database or session)
  // 2. Call the backend API to clock in
  // 3. Return the result

  bot.sendMessage(chatId, 
    `Location received!\n` +
    `Latitude: ${location.latitude}\n` +
    `Longitude: ${location.longitude}\n\n` +
    `Please use the Mini App for full clock-in functionality.`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⏰ Clock In',
              web_app: { url: `${MINI_APP_URL}/attendance` }
            }
          ]
        ],
        remove_keyboard: true
      }
    }
  );
});

// Webhook endpoint (optional - for production)
app.post('/webhook', async (req, res) => {
  try {
    const { message, callback_query } = req.body;

    if (message) {
      bot.processUpdate(req.body);
    }

    if (callback_query) {
      // Handle inline button callbacks
      console.log('Callback query:', callback_query.data);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'running' });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🤖 Telegram bot server running on port ${PORT}`);
  console.log(`📱 Mini App URL: ${MINI_APP_URL}`);
  console.log(`🔗 Backend API: ${BACKEND_API_URL}`);
});

console.log('✅ Bot started successfully!');
