-- Fix time entries where clock_out is on a different date than it should be
-- Set clock_out to be on the same calendar day as clock_in (Manila time), typically 8-9 hours later

UPDATE public.time_entries
SET clock_out = (clock_in::timestamp at time zone 'UTC' at time zone 'Asia/Manila' + interval '9 hours')::timestamp at time zone 'Asia/Manila' at time zone 'UTC',
    updated_at = now()
WHERE clock_out IS NOT NULL
  AND clock_in IS NOT NULL
  AND (clock_out::timestamp - clock_in::timestamp) > interval '12 hours';