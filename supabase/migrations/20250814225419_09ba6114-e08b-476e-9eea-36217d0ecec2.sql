begin;

-- Enable RLS on user_roles table (critical security fix)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table
-- Managers can manage all roles
CREATE POLICY "Managers can manage all user roles"
ON public.user_roles
FOR ALL
USING (has_role('manager'::app_role))
WITH CHECK (has_role('manager'::app_role));

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

commit;