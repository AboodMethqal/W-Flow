-- Settings table for per-user configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_url TEXT,
  whapi_token TEXT,
  whapi_channel_id TEXT,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_report_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_report_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.settings FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
