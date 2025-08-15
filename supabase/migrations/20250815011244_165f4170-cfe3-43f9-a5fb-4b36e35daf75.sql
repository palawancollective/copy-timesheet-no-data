-- Fix RLS policies for weekly_schedules to allow public access for reading and writing
-- This will enable the schedule calendar to work properly

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Managers only on weekly_schedules" ON public.weekly_schedules;

-- Add policies for public access to schedules
CREATE POLICY "Public can view weekly_schedules" 
ON public.weekly_schedules 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert weekly_schedules" 
ON public.weekly_schedules 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can update weekly_schedules" 
ON public.weekly_schedules 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete weekly_schedules" 
ON public.weekly_schedules 
FOR DELETE 
USING (true);