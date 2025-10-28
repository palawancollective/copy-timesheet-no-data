-- Fix lunch and clock out times for paid entries
-- Set correct times: Clock in 7AM, Lunch out 12PM, Lunch in 1PM, Clock out 4PM Manila time

UPDATE time_entries
SET 
  -- Clock out should be 4:00 PM Manila (08:00 UTC)
  clock_out = (entry_date::timestamp + interval '1 day')::date + time '08:00:00',
  -- Lunch out should be 12:00 PM Manila (04:00 UTC)  
  lunch_out = (entry_date::timestamp + interval '1 day')::date + time '04:00:00',
  -- Lunch in should be 1:00 PM Manila (05:00 UTC)
  lunch_in = (entry_date::timestamp + interval '1 day')::date + time '05:00:00',
  updated_at = now()
WHERE is_paid = true
  AND entry_date >= '2025-08-15'
  AND entry_date <= CURRENT_DATE
  AND clock_in IS NOT NULL;