import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { EmployeeTaskManager } from './EmployeeTaskManager';
import { WeeklySchedule } from './schedule/WeeklySchedule';
import { AdminHeader } from './admin/AdminHeader';
import { AddEmployeeForm } from './admin/AddEmployeeForm';
import { BulkClockOut } from './admin/BulkClockOut';
import { TimesheetDownload } from './admin/TimesheetDownload';
import { HoursCalculator } from './admin/HoursCalculator';
import { TimeEntriesTable } from './admin/TimeEntriesTable';
import { PaymentsList } from './PaymentsList';
import { DailyTaskAssignment } from './admin/DailyTaskAssignment';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const queryClient = useQueryClient();

  // Fix JR's entry date to today (7/13/2025)
  React.useEffect(() => {
    const fixJRDate = async () => {
      const today = '2025-07-13';
      const { error } = await supabase
        .from('time_entries')
        .update({ entry_date: today })
        .eq('entry_date', '2025-07-12')
        .in('employee_id', [
          // We'll update all entries from 7/12 to 7/13
        ]);
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
        queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      }
    };
    
    fixJRDate();
  }, [queryClient]);

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

  // Fetch all time entries
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['allTimeEntries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          employees (name, hourly_rate)
        `)
        .order('entry_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const calculateWorkHours = (entry: any): number => {
    if (!entry.clock_in || !entry.clock_out) return 0;
    
    const clockIn = new Date(entry.clock_in);
    const clockOut = new Date(entry.clock_out);
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    
    return Math.max(0, totalMinutes / 60);
  };

  // Enhanced hours calculation for CSV that handles ongoing work
  const calculateWorkHoursForCSV = (entry: any): number => {
    if (!entry.clock_in) return 0;
    
    const clockIn = new Date(entry.clock_in);
    const clockOut = entry.clock_out ? new Date(entry.clock_out) : new Date();
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    
    return Math.max(0, totalMinutes / 60);
  };

  // Get today's entries that are clocked in but not clocked out
  const today = new Date().toISOString().split('T')[0];
  const activeEntries = timeEntries.filter(entry => 
    entry.entry_date === today && 
    entry.clock_in && 
    !entry.clock_out
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <AdminHeader onLogout={onLogout} />

      {/* Add Employee */}
      <AddEmployeeForm />

      {/* Daily Task Assignment */}
      <DailyTaskAssignment />

      {/* Employee Task Management with Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Employee Task & Schedule Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schedule Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Weekly Schedule Management</h3>
            <WeeklySchedule isAdminMode={true} />
          </div>
          
          {/* Task Management Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Task Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <EmployeeTaskManager key={employee.id} employee={employee} isAdminMode={true} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Clock Out Section */}
      <BulkClockOut activeEntries={activeEntries} />

      {/* Download Timesheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Timesheet Management
            <TimesheetDownload 
              timeEntries={timeEntries}
              calculateWorkHoursForCSV={calculateWorkHoursForCSV}
              employees={employees}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calculation Section */}
          <HoursCalculator 
            timeEntries={timeEntries}
            calculateWorkHours={calculateWorkHours}
            employees={employees}
          />
          
          {/* Time Entries Table */}
          <TimeEntriesTable 
            timeEntries={timeEntries}
            calculateWorkHours={calculateWorkHours}
          />
        </CardContent>
      </Card>

      {/* All Employee Payments */}
      <PaymentsList showEmployeeName={true} isAdminMode={true} />
    </div>
  );
};