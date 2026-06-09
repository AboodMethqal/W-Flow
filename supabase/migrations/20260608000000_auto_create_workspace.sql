-- ========================================
-- Auto-create default workspace on signup
-- ========================================

-- تحديث دالة handle_new_user لإنشاء workspace افتراضي
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- 1. إنشاء profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- 2. إنشاء workspace افتراضي
  INSERT INTO public.workspaces (owner_id, name, slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
    'ws-' || replace(gen_random_uuid()::text, '-', '')
  )
  RETURNING id INTO new_workspace_id;
  
  -- 3. إضافة المستخدم كـ owner للـ workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
