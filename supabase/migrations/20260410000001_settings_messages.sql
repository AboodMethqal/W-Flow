-- Add custom message templates and auto-reply message to settings
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS auto_reply_message TEXT,
  ADD COLUMN IF NOT EXISTS msg_delivering TEXT,
  ADD COLUMN IF NOT EXISTS msg_completed TEXT,
  ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Default messages
UPDATE public.settings SET
  auto_reply_message = COALESCE(auto_reply_message, 'مرحباً! 👋 للاطلاع على أسعارنا وتفاصيل المنتجات، تفضل بزيارة متجرنا: {store_url}'),
  msg_delivering = COALESCE(msg_delivering, 'أهلاً {customer_name} 🚚 طلبك رقم #{order_number} تم شحنه بنجاح وهو في طريقه إليك. شكراً لثقتك بنا! 💚'),
  msg_completed = COALESCE(msg_completed, 'أهلاً {customer_name} ✅ طلبك رقم #{order_number} تم تسليمه بنجاح. نشكرك على تعاملك معنا، يسعدنا تقييمك لتجربتك! ⭐');
