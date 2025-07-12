-- Fix incorrect time entries

-- First, delete the incorrect July 11 entries for JR and Mark
DELETE FROM time_entries 
WHERE employee_id IN ('19aeb513-b31c-4121-92be-ca2ea52ad881', 'a7e13e8a-4781-47bd-9b65-733d36f9194d')
AND entry_date = '2025-07-11'
AND clock_in = '2025-07-11 00:00:00+00'
AND clock_out = '2025-07-11 08:00:00+00';

-- Add correct July 11 entries for JR and Mark (8am-4pm Manila time = 00:00-08:00 UTC)
INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out)
VALUES 
  -- JR's correct entry for July 11 (8am-4pm Manila = 00:00-08:00 UTC)
  ('19aeb513-b31c-4121-92be-ca2ea52ad881', '2025-07-11', '2025-07-11 00:00:00+00', '2025-07-11 08:00:00+00'),
  -- Mark's correct entry for July 11 (8am-4pm Manila = 00:00-08:00 UTC)  
  ('a7e13e8a-4781-47bd-9b65-733d36f9194d', '2025-07-11', '2025-07-11 00:00:00+00', '2025-07-11 08:00:00+00');

-- Delete all incorrect July 12 entries
DELETE FROM time_entries WHERE entry_date = '2025-07-12';

-- Add correct July 12 entries - everyone should be clocked OUT (not showing as currently working)
-- Create completed work day entries (8am-4pm Manila = 00:00-08:00 UTC)
INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out)
SELECT 
  id as employee_id,
  '2025-07-12' as entry_date,
  '2025-07-12 00:00:00+00' as clock_in,
  '2025-07-12 08:00:00+00' as clock_out
FROM employees;