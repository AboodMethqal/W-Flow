
CREATE OR REPLACE FUNCTION public.get_customers_with_stats(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  total_orders bigint,
  total_revenue numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    c.notes,
    c.created_at,
    c.updated_at,
    c.user_id,
    COALESCE(COUNT(o.id), 0) AS total_orders,
    COALESCE(SUM(o.amount), 0) AS total_revenue
  FROM public.customers c
  LEFT JOIN public.orders o ON o.customer_id = c.id
  GROUP BY c.id, c.name, c.phone, c.email, c.notes, c.created_at, c.updated_at, c.user_id;
$$;
