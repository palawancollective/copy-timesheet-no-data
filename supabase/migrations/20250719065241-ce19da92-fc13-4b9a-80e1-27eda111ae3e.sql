-- Enable real-time for employees and weekly_schedules tables
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.weekly_schedules REPLICA IDENTITY FULL;

-- Add tables to realtime publication (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_schedules;