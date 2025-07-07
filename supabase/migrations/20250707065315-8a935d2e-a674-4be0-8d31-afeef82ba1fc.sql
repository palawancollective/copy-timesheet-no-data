-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_entries table for tracking clock in/out events
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  lunch_out TIMESTAMP WITH TIME ZONE,
  lunch_in TIMESTAMP WITH TIME ZONE,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_amount DECIMAL(10,2),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_tasks table for daily tasks
CREATE TABLE public.employee_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  task_description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default employees with their rates
INSERT INTO public.employees (name, hourly_rate) VALUES 
  ('Mark', 62.50),
  ('Boyy', 62.50),
  ('Jerry', 50.00),
  ('Housekeeping', 50.00);

-- Insert default tasks for all employees
INSERT INTO public.employee_tasks (employee_id, task_description, priority) 
SELECT e.id, task.description, task.priority
FROM public.employees e
CROSS JOIN (
  VALUES 
    ('Clean tables and sweep deck', 1),
    ('Set up kitchen for breakfast', 2),
    ('Check on vegetables and fruit', 3),
    ('Make rice', 4),
    ('Feed dogs', 5),
    ('Make coffee and rice', 6),
    ('Do we have ice and cold water bottles?', 7),
    ('Inventory on chicken, pork, tofu, beef, flour, fruit, and vegetables', 8)
) AS task(description, priority);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since no user authentication required)
CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on time_entries" ON public.time_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on employee_tasks" ON public.employee_tasks FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_tasks_updated_at
  BEFORE UPDATE ON public.employee_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time for employee_tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_tasks;