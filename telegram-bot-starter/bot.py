#!/usr/bin/env python3
"""
Alef ERP Telegram Bot – starts the Member Portal as a Mini App.
- Sets the menu button to "Open" (like BotFather) so the purple Open button appears
  in the chat and in the bot list without the user sending /start.
- On /start: welcome message with image from internet + "Open Member Portal" button.
Uses .env: telegram_bot_token, telegram_mini_app_url, telegram_bot_username,
           telegram_welcome_image_url (optional).
"""
import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, ContextTypes

# Load .env from script directory (works when .env is mounted at /app/.env in Docker)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

TOKEN = os.getenv("telegram_bot_token")
MINI_APP_URL = (os.getenv("telegram_mini_app_url") or "").rstrip("/")
BOT_USERNAME = os.getenv("telegram_bot_username", "aleferp_bot")
# Optional: URL of a welcome image (shown when user sends /start). Use HTTPS.
WELCOME_IMAGE_URL = (os.getenv("telegram_welcome_image_url") or "").strip() or None

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def build_start_keyboard():
    """Inline keyboard with one button that opens the Mini App (Web App)."""
    if not MINI_APP_URL:
        return None
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "Open Member Portal",
            web_app=WebAppInfo(url=MINI_APP_URL),
        )],
    ])


async def post_init_set_menu_button(application: Application) -> None:
    """Set the bot menu button to 'Open' (Web App) so it appears in chat and in bot list."""
    if not MINI_APP_URL:
        logger.warning("Mini App URL not set – menu button not configured")
        return
    try:
        await application.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="Open", web_app=WebAppInfo(url=MINI_APP_URL)),
        )
        logger.info("Menu button set to 'Open' -> %s", MINI_APP_URL)
    except Exception as e:
        logger.warning("Could not set menu button: %s", e)


async def cmd_start(update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start: welcome image (if URL set) + caption + button to open Mini App."""
    keyboard = build_start_keyboard()
    text = (
        "Welcome to Alef ERP.\n\n"
        "Use the *Open* button below the message box, or the button here, to open the Member Portal "
        "(clock in/out, roster, salary, profile)."
    )
    if keyboard:
        if WELCOME_IMAGE_URL:
            try:
                await update.message.reply_photo(
                    photo=WELCOME_IMAGE_URL,
                    caption=text,
                    reply_markup=keyboard,
                    parse_mode="Markdown",
                )
                return
            except Exception as e:
                logger.warning("Welcome image failed (%s), sending text only", e)
        await update.message.reply_text(text, reply_markup=keyboard, parse_mode="Markdown")
    else:
        await update.message.reply_text(text + "\n\n(Mini App URL not set in .env)", parse_mode="Markdown")


async def cmd_menu(update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /menu: same as /start."""
    await cmd_start(update, context)


def main():
    if not TOKEN:
        logger.error("telegram_bot_token not set in .env")
        raise SystemExit(1)

    app = (
        Application.builder()
        .token(TOKEN)
        .post_init(post_init_set_menu_button)
        .build()
    )
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("menu", cmd_menu))

    logger.info("Bot starting (Mini App: %s)", MINI_APP_URL or "not set")
    app.run_polling(allowed_updates=["message"])


if __name__ == "__main__":
    main()
