-- Fix Ryan Maintenance hourly rate from 400 to 40
UPDATE public.employees 
SET hourly_rate = 40.00 
WHERE id = '7119f240-7257-4b46-8369-be1bffe56445';