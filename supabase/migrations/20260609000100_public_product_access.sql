-- Add public SELECT policy for products table
-- This allows anonymous storefront visitors to view available products

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can view available products') THEN
    CREATE POLICY "Anyone can view available products"
      ON public.products FOR SELECT
      USING (is_available = true);
  END IF;
END $$;
