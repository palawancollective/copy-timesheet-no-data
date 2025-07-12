-- Remove all July 12 time entries so no one appears as clocked in
DELETE FROM time_entries WHERE entry_date = '2025-07-12';