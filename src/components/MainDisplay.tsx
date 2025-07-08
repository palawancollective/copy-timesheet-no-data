
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AllTimeEntries } from './AllTimeEntries';
import { EmployeeClockIn } from './EmployeeClockIn';
import { RealTimeTaskDisplay } from './RealTimeTaskDisplay';
import { toast } from '@/hooks/use-toast';

export const MainDisplay = ({ isAdminMode = false }: { isAdminMode?: boolean }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const queryClient = useQueryClient();

  // Get Manila timezone date and time
  const getManilaDate = () => {
    const now = new Date();
    const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    return manilaTime.toISOString().split('T')[0];
  };

  const getManilaDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"})).toISOString();
  };

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all time entries for real-time display
  const { data: allEntries = [] } = useQuery({
    queryKey: ['allTimeEntries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          employees (name, hourly_rate)
        `)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000 // Refresh every 5 seconds for real-time updates
  });

  // Auto-refresh data every 5 seconds for more frequent updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
    }, 5000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('main-display-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Clock in/out mutations
  const clockInMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const today = getManilaDate();
      const now = getManilaDateTime();
      
      // Check if there's already an entry for today
      const { data: existingEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('entry_date', today)
        .single();

      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('time_entries')
          .update({ clock_in: now, updated_at: now })
          .eq('id', existingEntry.id);
        
        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('time_entries')
          .insert({
            employee_id: employeeId,
            entry_date: today,
            clock_in: now
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      toast({ title: "Clocked in successfully!" });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const today = getManilaDate();
      const now = getManilaDateTime();
      
      const { error } = await supabase
        .from('time_entries')
        .update({ clock_out: now, updated_at: now })
        .eq('employee_id', employeeId)
        .eq('entry_date', today);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      toast({ title: "Clocked out successfully!" });
    }
  });

  const lunchOutMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const today = getManilaDate();
      const now = getManilaDateTime();
      
      const { error } = await supabase
        .from('time_entries')
        .update({ lunch_out: now, updated_at: now })
        .eq('employee_id', employeeId)
        .eq('entry_date', today);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      toast({ title: "Lunch out recorded!" });
    }
  });

  const lunchInMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const today = getManilaDate();
      const now = getManilaDateTime();
      
      const { error } = await supabase
        .from('time_entries')
        .update({ lunch_in: now, updated_at: now })
        .eq('employee_id', employeeId)
        .eq('entry_date', today);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      toast({ title: "Lunch in recorded!" });
    }
  });

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="w-full max-w-full space-y-4 md:space-y-6 overflow-x-hidden">
      <Tabs defaultValue="employee" className="w-full">
        <TabsList className={`grid w-full ${isAdminMode ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {isAdminMode && <TabsTrigger value="admin">Admin Clock</TabsTrigger>}
          <TabsTrigger value="employee">Employee Clock-In</TabsTrigger>
          <TabsTrigger value="tasks">Task Progress</TabsTrigger>
        </TabsList>
        
        {isAdminMode && (
          <TabsContent value="admin" className="space-y-4 md:space-y-6">
            {/* Employee Selection */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Select Employee</h2>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Action Buttons */}
            {selectedEmployeeId && (
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
                  Time Actions for {selectedEmployee?.name}
                </h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 w-full">
                  <Button
                    onClick={() => clockInMutation.mutate(selectedEmployeeId)}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 text-sm md:text-base w-full"
                    disabled={clockInMutation.isPending}
                  >
                    Clock In
                  </Button>
                  <Button
                    onClick={() => clockOutMutation.mutate(selectedEmployeeId)}
                    className="bg-red-600 hover:bg-red-700 text-white py-3 text-sm md:text-base w-full"
                    disabled={clockOutMutation.isPending}
                  >
                    Clock Out
                  </Button>
                  <Button
                    onClick={() => lunchOutMutation.mutate(selectedEmployeeId)}
                    className="bg-orange-600 hover:bg-orange-700 text-white py-3 text-sm md:text-base w-full"
                    disabled={lunchOutMutation.isPending}
                  >
                    Lunch Out
                  </Button>
                  <Button
                    onClick={() => lunchInMutation.mutate(selectedEmployeeId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm md:text-base w-full"
                    disabled={lunchInMutation.isPending}
                  >
                    Lunch In
                  </Button>
                </div>
              </div>
            )}

            {/* All Time Entries */}
            <div className="w-full overflow-x-hidden">
              <AllTimeEntries entries={allEntries} />
            </div>
          </TabsContent>
        )}
        
        <TabsContent value="employee">
          <EmployeeClockIn />
        </TabsContent>
        
        <TabsContent value="tasks">
          <RealTimeTaskDisplay onGoHome={() => {
            // Switch to employee clock-in tab
            const tabsList = document.querySelector('[role="tablist"]');
            const employeeTab = tabsList?.querySelector('[value="employee"]') as HTMLElement;
            employeeTab?.click();
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
