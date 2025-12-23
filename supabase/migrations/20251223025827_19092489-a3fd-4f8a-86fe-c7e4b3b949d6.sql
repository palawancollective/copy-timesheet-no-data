-- Fix search_path for delete_employee_and_related function
CREATE OR REPLACE FUNCTION public.delete_employee_and_related(employee_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.payment_notes WHERE payment_id IN (SELECT id FROM public.payments WHERE employee_id = employee_id_param);
  DELETE FROM public.payments WHERE employee_id = employee_id_param;
  DELETE FROM public.employee_tasks WHERE employee_id = employee_id_param;
  DELETE FROM public.time_entries WHERE employee_id = employee_id_param;
  DELETE FROM public.weekly_schedules WHERE employee_id = employee_id_param;
  DELETE FROM public.employees WHERE id = employee_id_param;
END;
$$;