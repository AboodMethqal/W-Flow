-- Reset all data (useful for development/testing)
CREATE OR REPLACE FUNCTION public.reset_all_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.tenant_api_keys WHERE id IS NOT NULL;
  DELETE FROM public.workspace_members WHERE id IS NOT NULL;
  DELETE FROM public.workspaces WHERE id IS NOT NULL;
  DELETE FROM public.settings WHERE id IS NOT NULL;
  DELETE FROM public.orders WHERE id IS NOT NULL;
  DELETE FROM public.order_items WHERE id IS NOT NULL;
  DELETE FROM public.customers WHERE id IS NOT NULL;
  DELETE FROM public.profiles WHERE id IS NOT NULL;
  DELETE FROM auth.users WHERE id IS NOT NULL;
  RETURN 'All data reset successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;
