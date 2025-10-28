-- Delete older duplicate entries for Oct 12, keeping only the most recent one per employee
WITH ranked_entries AS (
  SELECT id, 
    ROW_NUMBER() OVER (PARTITION BY employee_id, entry_date ORDER BY created_at DESC) as rn
  FROM time_entries
  WHERE entry_date = '2025-10-12'
)
DELETE FROM time_entries
WHERE id IN (
  SELECT id FROM ranked_entries WHERE rn > 1
);