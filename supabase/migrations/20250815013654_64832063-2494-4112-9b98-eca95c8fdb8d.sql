-- Add foreign key constraint to link payments to employees
ALTER TABLE public.payments 
ADD CONSTRAINT payments_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.employees(id) 
ON DELETE CASCADE;