-- 1. جدول الشركات/المؤسسات (Workspaces)
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. جدول أعضاء الفريق (Workspace Members)
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- 3. تحديث جدول customers بـ workspace_id
ALTER TABLE public.customers ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 4. تحديث جدول orders بـ workspace_id
ALTER TABLE public.orders ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 5. تحديث جدول settings بـ workspace_id
ALTER TABLE public.settings ADD COLUMN workspace_id UUID UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 6. إنشاء Indexes للأداء السريع
CREATE INDEX idx_customers_workspace ON public.customers(workspace_id);
CREATE INDEX idx_orders_workspace ON public.orders(workspace_id);
CREATE INDEX idx_workspace_members ON public.workspace_members(workspace_id);
