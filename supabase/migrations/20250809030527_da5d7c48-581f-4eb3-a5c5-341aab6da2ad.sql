begin;

-- Relax read access to time_entries while keeping write operations restricted to managers
-- Drop the existing broad policy
DROP POLICY IF EXISTS "Managers only on time_entries" ON public.time_entries;

-- Public read-only access for activity log visibility
CREATE POLICY "Public can view time_entries"
ON public.time_entries
FOR SELECT
USING (true);

-- Manager-only write operations
CREATE POLICY "Managers can insert time_entries"
ON public.time_entries
FOR INSERT
WITH CHECK (has_role('manager'::app_role));

CREATE POLICY "Managers can update time_entries"
ON public.time_entries
FOR UPDATE
USING (has_role('manager'::app_role))
WITH CHECK (has_role('manager'::app_role));

CREATE POLICY "Managers can delete time_entries"
ON public.time_entries
FOR DELETE
USING (has_role('manager'::app_role));

commit;