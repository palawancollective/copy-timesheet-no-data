-- Mark all time entries from Aug 15, 2025 to today as paid
UPDATE time_entries 
SET 
  is_paid = true,
  paid_at = CASE 
    WHEN paid_at IS NULL THEN NOW()
    ELSE paid_at
  END,
  paid_amount = CASE 
    WHEN paid_amount IS NULL OR paid_amount = 0 THEN 
      -- Calculate hours worked (clock_out - clock_in - lunch break)
      (
        CASE 
          WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL THEN
            (
              EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600 -
              CASE 
                WHEN lunch_out IS NOT NULL AND lunch_in IS NOT NULL THEN
                  EXTRACT(EPOCH FROM (lunch_in - lunch_out)) / 3600
                ELSE 0
              END
            ) * (SELECT hourly_rate FROM employees WHERE id = time_entries.employee_id)
          ELSE 0
        END
      )
    ELSE paid_amount
  END,
  updated_at = NOW()
WHERE entry_date >= '2025-08-15' 
  AND entry_date <= CURRENT_DATE
  AND is_paid = false;