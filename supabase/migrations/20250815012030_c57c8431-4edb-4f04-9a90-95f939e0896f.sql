-- Check and fix RLS policies for time_entries to ensure proper delete permissions
-- Ensure public delete access is enabled

-- Check current policies and fix if needed
DROP POLICY IF EXISTS "Managers can delete time_entries" ON public.time_entries;

-- Create comprehensive policies for time_entries
CREATE POLICY "Public can delete time_entries" 
ON public.time_entries 
FOR DELETE 
USING (true);