-- ========================================
-- Telegram Bot API Integration for Multi-Tenant SaaS
-- ========================================

-- 1. جدول API Keys للتجار
CREATE TABLE public.tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- إنشاء index للأداء السريع
CREATE INDEX idx_tenant_api_keys_workspace ON public.tenant_api_keys(workspace_id);
CREATE INDEX idx_tenant_api_keys_key ON public.tenant_api_keys(api_key);

-- تمكين RLS
ALTER TABLE public.tenant_api_keys ENABLE ROW LEVEL SECURITY;

-- سياسات RLS: فقط مالك workspace أو أعضاء الفريق يمكنهم إدارة API keys الخاصة بهم
CREATE POLICY "Users can view own workspace api keys"
  ON public.tenant_api_keys FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workspace api keys"
  ON public.tenant_api_keys FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update own workspace api keys"
  ON public.tenant_api_keys FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete own workspace api keys"
  ON public.tenant_api_keys FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 2. تحديث سياسات RLS للجداول لاستخدام workspace_id بدلاً من user_id
-- تحديث سياسات جدول orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;

CREATE POLICY "Workspace members can view orders"
  ON public.orders FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update orders"
  ON public.orders FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete orders"
  ON public.orders FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- تحديث سياسات جدول customers
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;

CREATE POLICY "Workspace members can view customers"
  ON public.customers FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update customers"
  ON public.customers FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can delete customers"
  ON public.customers FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- تحديث سياسات جدول order_items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can update own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can delete own order items" ON public.order_items;

CREATE POLICY "Workspace members can view order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can update order items"
  ON public.order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can delete order items"
  ON public.order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- 3. إنشاء دالة helper للتحقق من API Key
CREATE OR REPLACE FUNCTION public.verify_api_key(api_key_text TEXT)
RETURNS TABLE (
  workspace_id UUID,
  is_valid BOOLEAN,
  api_key_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tak.workspace_id,
    true AS is_valid,
    tak.id AS api_key_id
  FROM public.tenant_api_keys tak
  WHERE tak.api_key = api_key_text 
    AND tak.is_active = true
    AND (tak.last_used_at IS NULL OR tak.last_used_at > NOW() - INTERVAL '90 days')
  LIMIT 1;
  
  -- تحديث last_used_at إذا وجدنا الـ API key
  IF FOUND THEN
    UPDATE public.tenant_api_keys 
    SET last_used_at = NOW() 
    WHERE id = (SELECT api_key_id FROM public.verify_api_key(api_key_text) LIMIT 1);
  END IF;
END;
$$;

-- 4. إضافة حقل bot_message_id لجدول orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS bot_message_id TEXT,
ADD COLUMN IF NOT EXISTS bot_source TEXT DEFAULT 'telegram';

-- 5. إنشاء index لـ bot_message_id للأداء السريع
CREATE INDEX idx_orders_bot_message_id ON public.orders(bot_message_id);

-- 6. تحديث جدول order_items لإضافة حقول size و color
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS color TEXT;