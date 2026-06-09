-- Make order_number sequential per workspace instead of global

-- 1. Resequence existing orders per workspace
WITH numbered AS (
  SELECT id, workspace_id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at, id) AS new_num
  FROM public.orders
)
UPDATE public.orders o
SET order_number = n.new_num
FROM numbered n
WHERE o.id = n.id;

-- 2. Drop the SERIAL default and sequence
ALTER TABLE public.orders ALTER COLUMN order_number DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.orders_order_number_seq;

-- 3. Create function to generate next order_number per workspace
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1 INTO NEW.order_number
  FROM public.orders
  WHERE workspace_id = NEW.workspace_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply trigger
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();
