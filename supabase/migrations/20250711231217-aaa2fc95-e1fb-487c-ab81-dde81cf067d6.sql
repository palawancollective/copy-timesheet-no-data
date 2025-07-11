-- Add JR and Mark's time entries for July 11 (8am-4pm)
INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out)
VALUES 
  -- JR's entry for July 11
  ('19aeb513-b31c-4121-92be-ca2ea52ad881', '2025-07-11', '2025-07-11 00:00:00+00', '2025-07-11 08:00:00+00'),
  -- Mark's entry for July 11  
  ('a7e13e8a-4781-47bd-9b65-733d36f9194d', '2025-07-11', '2025-07-11 00:00:00+00', '2025-07-11 08:00:00+00');

-- Clock out all employees for July 12 by creating time entries
INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out)
SELECT 
  id as employee_id,
  '2025-07-12' as entry_date,
  '2025-07-12 00:00:00+00' as clock_in,
  '2025-07-12 08:00:00+00' as clock_out
FROM employees
WHERE NOT EXISTS (
  SELECT 1 FROM time_entries 
  WHERE employee_id = employees.id 
  AND entry_date = '2025-07-12'
);