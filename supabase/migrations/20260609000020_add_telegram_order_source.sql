DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'telegram'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_source')
  ) THEN
    ALTER TYPE public.order_source ADD VALUE 'telegram';
  END IF;
END
$$;