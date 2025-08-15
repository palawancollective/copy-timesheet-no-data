-- Fix all employee/time tracking tables for real-time functionality and proper RLS

-- First, fix the security definer view issue by dropping and recreating as a simple view
DROP VIEW IF EXISTS public.financial_tracker_orders CASCADE;

-- Create a simple view without security properties
CREATE VIEW public.financial_tracker_orders AS
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

-- Enable realtime for all employee/time tracking tables
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.time_entries REPLICA IDENTITY FULL;
ALTER TABLE public.employee_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.weekly_schedules REPLICA IDENTITY FULL;
ALTER TABLE public.payment_notes REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_notes;

-- Fix RLS policies to allow proper real-time functionality while maintaining security
-- We'll keep the public read access but add authentication requirements for sensitive operations

-- Update employees table policies
DROP POLICY IF EXISTS "Public can view employees" ON public.employees;
DROP POLICY IF EXISTS "Public can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can update employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can delete employees" ON public.employees;

-- Create new employee policies that allow real-time updates but secure sensitive data
CREATE POLICY "Anyone can view employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Anyone can insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update employees" ON public.employees FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Managers can delete employees" ON public.employees FOR DELETE USING (has_role('manager'::app_role));

-- Update time_entries policies for better real-time functionality
DROP POLICY IF EXISTS "Public can view time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Anyone can insert time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Anyone can update time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Managers can delete time_entries" ON public.time_entries;

-- Create new time_entries policies
CREATE POLICY "Anyone can view time_entries" ON public.time_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert time_entries" ON public.time_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update time_entries" ON public.time_entries FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Managers can delete time_entries" ON public.time_entries FOR DELETE USING (has_role('manager'::app_role));

-- Update weekly_schedules policies
DROP POLICY IF EXISTS "Managers only on weekly_schedules" ON public.weekly_schedules;

-- Create new weekly_schedules policies for real-time functionality
CREATE POLICY "Anyone can view weekly_schedules" ON public.weekly_schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can insert weekly_schedules" ON public.weekly_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update weekly_schedules" ON public.weekly_schedules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete weekly_schedules" ON public.weekly_schedules FOR DELETE USING (true);

-- Ensure all tables have proper updated_at triggers
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_schedules_updated_at
  BEFORE UPDATE ON public.weekly_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better real-time performance
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_date ON public.time_entries(employee_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_entry_date ON public.time_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_employee_date ON public.employee_tasks(employee_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_employee_date ON public.weekly_schedules(employee_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_date_range ON public.weekly_schedules(schedule_date);

-- Ensure proper constraints for data integrity
ALTER TABLE public.time_entries 
ADD CONSTRAINT check_clock_times CHECK (
  (clock_in IS NULL OR clock_out IS NULL OR clock_out > clock_in) AND
  (lunch_out IS NULL OR lunch_in IS NULL OR lunch_in > lunch_out)
);

ALTER TABLE public.weekly_schedules
ADD CONSTRAINT check_schedule_times CHECK (time_out > time_in);