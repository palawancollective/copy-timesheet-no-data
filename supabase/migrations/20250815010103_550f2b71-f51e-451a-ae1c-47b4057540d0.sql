-- Fix Security Definer View issue by recreating the financial_tracker_orders view
-- without any security definer properties

-- Drop and recreate the view to ensure it's clean
DROP VIEW IF EXISTS public.financial_tracker_orders;

-- Create the view without any security definer properties
CREATE VIEW public.financial_tracker_orders AS
SELECT 
  id,
  created_at::date AS transaction_date,
  created_at,
  updated_at,
  customer_name,
  customer_whatsapp,
  location,
  total_amount AS amount,
  status,
  special_requests AS notes,
  messaging_platform
FROM public.orders 
ORDER BY created_at DESC;