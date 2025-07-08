-- Create weekly_schedules table for employee scheduling
CREATE TABLE public.weekly_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  schedule_date DATE NOT NULL,
  time_in TIME NOT NULL,
  time_out TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for schedule access
CREATE POLICY "Allow all operations on weekly_schedules" 
ON public.weekly_schedules 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add foreign key constraint to employees table
ALTER TABLE public.weekly_schedules 
ADD CONSTRAINT weekly_schedules_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_weekly_schedules_employee_date ON public.weekly_schedules(employee_id, schedule_date);
CREATE INDEX idx_weekly_schedules_date ON public.weekly_schedules(schedule_date);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weekly_schedules_updated_at
BEFORE UPDATE ON public.weekly_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();