# Alef ERP Telegram Bot

Starts the **Member Portal** as a Telegram Mini App (Web App).

- **Menu button (“Open”)**: The bot sets the **menu button** to your Mini App URL, so the purple **Open** button appears next to the message box (and in the bot list) as soon as the user opens the chat – no need to send /start first.
- **/start**: Welcome message, optional image from the internet, and an “Open Member Portal” button.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather), get the token.
2. Copy `.env.example` to `.env` and set:
   - `telegram_bot_token` – token from BotFather
   - `telegram_mini_app_url` – Member Portal URL (e.g. `https://erp-member.alefdelta.com`)
   - `telegram_bot_username` – bot username (e.g. `aleferp_bot`)
   - `telegram_welcome_image_url` (optional) – HTTPS URL of a welcome image shown when user sends /start

## Run with Docker (recommended)

From the project root:

```bash
docker-compose up -d telegram_bot
```

The service uses `./telegram-bot-starter/.env` via `env_file` and mounts the same file at `/app/.env`.

**If you get a `'ContainerConfig'` error** when recreating the bot (e.g. after changing config):

```bash
docker rm -f alef_erp_telegram_bot
docker-compose up -d telegram_bot
```

## Run locally

```bash
cd telegram-bot-starter
pip install -r requirements.txt
python bot.py
```

## Commands

- **Open** (menu button) – Set by the bot; opens the Mini App without sending a message.
- **/start** – Welcome message (+ optional image) and “Open Member Portal” button.
- **/menu** – Same as /start.

## Menu button (Open)

The bot calls Telegram’s `setChatMenuButton` at startup so the **Open** button (like in BotFather) appears in the chat and in the bot list. To get the **Open** button in the **chat list** (next to "Alef ERP" so users can tap it without opening the chat), also set the menu button in **BotFather**:

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send: **`/setmenubutton`**
3. Choose your bot (e.g. **@aleferp_bot**).
4. Choose **Configure menu button** (or **Web app**).
5. When asked for the URL, enter your Member Portal URL, e.g. **`https://erp-member.alefdelta.com`**
6. When asked for the button text, enter **`Open`**

After this, the purple **Open** button should appear in the chat list next to your bot so users can open the Mini App with one tap without opening the chat.
