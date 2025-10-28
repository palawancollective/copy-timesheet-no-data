-- Remove lunch_out and lunch_in columns from time_entries table
ALTER TABLE public.time_entries 
DROP COLUMN IF EXISTS lunch_out,
DROP COLUMN IF EXISTS lunch_in;