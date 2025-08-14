begin;
-- Allow public writes to time_entries so clock-in/out works without auth; keep deletes manager-only
DROP POLICY IF EXISTS "Managers can insert time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Managers can update time_entries" ON public.time_entries;

-- Public insert
CREATE POLICY "Anyone can insert time_entries"
ON public.time_entries
FOR INSERT
WITH CHECK (true);

-- Public update
CREATE POLICY "Anyone can update time_entries"
ON public.time_entries
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Keep existing manager-only delete policy intact
commit;