-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT,
  hourly_rate NUMERIC DEFAULT 62.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clock_out TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_tasks table
CREATE TABLE IF NOT EXISTS public.employee_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  priority INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_schedules table
CREATE TABLE IF NOT EXISTS public.weekly_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  time_in TIME NOT NULL,
  time_out TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_notes table
CREATE TABLE IF NOT EXISTS public.payment_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_templates table
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_slot TEXT NOT NULL,
  task_description TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (no authentication required for this app)
CREATE POLICY "Public access to employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to time_entries" ON public.time_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to employee_tasks" ON public.employee_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to weekly_schedules" ON public.weekly_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to payment_notes" ON public.payment_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to task_templates" ON public.task_templates FOR ALL USING (true) WITH CHECK (true);

-- Create function to delete employee and all related data
CREATE OR REPLACE FUNCTION public.delete_employee_and_related(employee_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON public.time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_entry_date ON public.time_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_employee_id ON public.employee_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_assigned_date ON public.employee_tasks(assigned_date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_employee_id ON public.weekly_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_schedule_date ON public.weekly_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_payments_employee_id ON public.payments(employee_id);