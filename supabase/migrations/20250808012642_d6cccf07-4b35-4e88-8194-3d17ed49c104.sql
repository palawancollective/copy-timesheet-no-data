-- Ensure RLS allows admins to edit/delete employees and public read/insert until auth is added
begin;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Managers only on employees" ON public.employees;
DROP POLICY IF EXISTS "Public can view employees" ON public.employees;
DROP POLICY IF EXISTS "Public can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can update employees" ON public.employees;
DROP POLICY IF EXISTS "Managers can delete employees" ON public.employees;

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view employees (used for dropdowns)
CREATE POLICY "Public can view employees"
ON public.employees
FOR SELECT
USING (true);

-- Allow anyone to insert employees (temporary until auth/roles are wired in the UI)
CREATE POLICY "Public can insert employees"
ON public.employees
FOR INSERT
WITH CHECK (true);

-- Only managers can update employees
CREATE POLICY "Managers can update employees"
ON public.employees
FOR UPDATE
USING (has_role('manager'))
WITH CHECK (has_role('manager'));

-- Only managers can delete employees
CREATE POLICY "Managers can delete employees"
ON public.employees
FOR DELETE
USING (has_role('manager'));

commit;