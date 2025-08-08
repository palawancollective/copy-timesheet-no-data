begin;

-- Create a helper function to delete an employee and all related data
create or replace function public.delete_employee_and_related(p_employee_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Remove payment notes tied to the employee or their time entries
  delete from public.payment_notes
  where employee_id = p_employee_id
     or time_entry_id in (
       select id from public.time_entries where employee_id = p_employee_id
     );

  -- Remove time entries
  delete from public.time_entries where employee_id = p_employee_id;

  -- Remove employee tasks
  delete from public.employee_tasks where employee_id = p_employee_id;

  -- Remove weekly schedules
  delete from public.weekly_schedules where employee_id = p_employee_id;

  -- Finally remove the employee record
  delete from public.employees where id = p_employee_id;

  return true;
end;
$$;

commit;