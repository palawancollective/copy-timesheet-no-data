import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Schedule } from '@/types/schedule';
import { getCurrentWeekStart } from '@/lib/scheduleUtils';
import { useToast } from '@/hooks/use-toast';

export const useScheduleData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch employees
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Employee[];
    }
  });

  // Fetch weekly schedules
  const schedulesQuery = useQuery({
    queryKey: ['weeklySchedules'],
    queryFn: async () => {
      const weekStart = getCurrentWeekStart();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const { data, error } = await supabase
        .from('weekly_schedules')
        .select(`
          *,
          employees (name)
        `)
        .gte('schedule_date', weekStart)
        .lte('schedule_date', weekEnd.toISOString().split('T')[0])
        .order('schedule_date')
        .order('time_in');
      
      if (error) throw error;
      return data as Schedule[];
    },
    refetchInterval: 3000 // Real-time updates every 3 seconds
  });

  // Add schedule mutation
  const addScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const { error } = await supabase
        .from('weekly_schedules')
        .insert(scheduleData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({ title: "Schedule added successfully!" });
    }
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('weekly_schedules')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({ title: "Schedule updated successfully!" });
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weekly_schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({ title: "Schedule deleted successfully!" });
    }
  });

  return {
    employees: employeesQuery.data || [],
    schedules: schedulesQuery.data || [],
    addScheduleMutation,
    updateScheduleMutation,
    deleteScheduleMutation,
    isLoading: employeesQuery.isLoading || schedulesQuery.isLoading
  };
};