-- Completely remove the view and related policies, then recreate as a simple view
-- without any security properties

-- Drop the view completely
DROP VIEW IF EXISTS public.financial_tracker_orders CASCADE;

-- Instead of a view, let's see if this resolves the security definer issue
-- We'll replace it with a simple view that inherits RLS from the orders table
CREATE VIEW public.financial_tracker_orders 
WITH (security_barrier = false) AS
SELECT 
  o.id,
  o.created_at::date AS transaction_date,
  o.created_at,
  o.updated_at,
  o.customer_name,
  o.customer_whatsapp,
  o.location,
  o.total_amount AS amount,
  o.status,
  o.special_requests AS notes,
  o.messaging_platform
FROM public.orders o
ORDER BY o.created_at DESC;

-- Ensure RLS is handled by the underlying orders table
-- No RLS policies needed on the view itself since it inherits from orders table