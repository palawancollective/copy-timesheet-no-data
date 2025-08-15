import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Schedule } from '@/types/schedule';
import { getCurrentWeekStart, getWeekStartFromDate } from '@/lib/scheduleUtils';
import { useToast } from '@/hooks/use-toast';

export const useScheduleData = (customWeekStart?: string) => {
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
    queryKey: ['weeklySchedules', customWeekStart],
    queryFn: async () => {
      const weekStart = customWeekStart ? getWeekStartFromDate(customWeekStart) : getCurrentWeekStart();
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
      
      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }
      return data as Schedule[];
    }
  });

  // Real-time subscriptions for immediate updates
  useEffect(() => {
    const employeeChannel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
      )
      .subscribe();

    const scheduleChannel = supabase
      .channel('schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_schedules'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(employeeChannel);
      supabase.removeChannel(scheduleChannel);
    };
  }, [queryClient]);

  // Add schedule mutation
  const addScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      console.log('Adding schedule:', scheduleData);
      const { data, error } = await supabase
        .from('weekly_schedules')
        .insert(scheduleData)
        .select();
      
      if (error) {
        console.error('Error adding schedule:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({ title: "Schedule added successfully!" });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({ 
        title: "Failed to add schedule", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('Updating schedule:', id, updates);
      const { data, error } = await supabase
        .from('weekly_schedules')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating schedule:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({ title: "Schedule updated successfully!" });
    },
    onError: (error: any) => {
      console.error('Update mutation error:', error);
      toast({ 
        title: "Failed to update schedule", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting schedule:', id);
      const { error } = await supabase
        .from('weekly_schedules')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting schedule:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({ title: "Schedule deleted successfully!" });
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      toast({ 
        title: "Failed to delete schedule", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
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