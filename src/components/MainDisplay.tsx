
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TodaysTimeEntries } from './TodaysTimeEntries';
import { toast } from '@/hooks/use-toast';

export const MainDisplay = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const queryClient = useQueryClient();

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

  // Fetch today's time entries
  const { data: todaysEntries = [] } = useQuery({
    queryKey: ['todaysEntries'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          employees (name, hourly_rate)
        `)
        .eq('entry_date', today)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Clock in/out mutations
  const clockInMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
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
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      toast({ title: "Clocked in successfully!" });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('time_entries')
        .update({ clock_out: now, updated_at: now })
        .eq('employee_id', employeeId)
        .eq('entry_date', today);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      toast({ title: "Clocked out successfully!" });
    }
  });

  const lunchOutMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('time_entries')
        .update({ lunch_out: now, updated_at: now })
        .eq('employee_id', employeeId)
        .eq('entry_date', today);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      toast({ title: "Lunch out recorded!" });
    }
  });

  const lunchInMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('time_entries')
        .update({ lunch_in: now, updated_at: now })
        .eq('employee_id', employeeId)
        .eq('entry_date', today);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      toast({ title: "Lunch in recorded!" });
    }
  });

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Employee Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Select Employee</h2>
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose an employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name} - ₱{employee.hourly_rate}/hr
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Action Buttons */}
      {selectedEmployeeId && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Time Actions for {selectedEmployee?.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => clockInMutation.mutate(selectedEmployeeId)}
              className="bg-green-600 hover:bg-green-700 text-white py-3"
              disabled={clockInMutation.isPending}
            >
              Clock In
            </Button>
            <Button
              onClick={() => clockOutMutation.mutate(selectedEmployeeId)}
              className="bg-red-600 hover:bg-red-700 text-white py-3"
              disabled={clockOutMutation.isPending}
            >
              Clock Out
            </Button>
            <Button
              onClick={() => lunchOutMutation.mutate(selectedEmployeeId)}
              className="bg-orange-600 hover:bg-orange-700 text-white py-3"
              disabled={lunchOutMutation.isPending}
            >
              Lunch Out
            </Button>
            <Button
              onClick={() => lunchInMutation.mutate(selectedEmployeeId)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={lunchInMutation.isPending}
            >
              Lunch In
            </Button>
          </div>
        </div>
      )}

      {/* Today's Time Entries */}
      <TodaysTimeEntries entries={todaysEntries} />
    </div>
  );
};
