-- Add telegram_bot_token to settings for Telegram bot webhook
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;

CREATE INDEX IF NOT EXISTS idx_settings_telegram_bot_token ON public.settings(telegram_bot_token);
