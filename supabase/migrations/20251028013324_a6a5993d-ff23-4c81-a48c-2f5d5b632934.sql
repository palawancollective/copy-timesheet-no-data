-- One-time update: Add lunch times and mark Oct 12 entries as paid
UPDATE time_entries 
SET 
  lunch_out = CASE 
    WHEN clock_in IS NOT NULL THEN (DATE(entry_date) || ' 04:00:00+00')::timestamptz
    ELSE NULL 
  END,
  lunch_in = CASE 
    WHEN clock_in IS NOT NULL THEN (DATE(entry_date) || ' 05:00:00+00')::timestamptz
    ELSE NULL 
  END,
  is_paid = true,
  paid_amount = CASE 
    WHEN paid_amount IS NULL OR paid_amount = 0 THEN 
      (SELECT e.hourly_rate * 7 FROM employees e WHERE e.id = time_entries.employee_id)
    ELSE paid_amount
  END,
  paid_at = CASE 
    WHEN paid_at IS NULL THEN NOW()
    ELSE paid_at
  END,
  updated_at = NOW()
WHERE entry_date = '2025-10-12';