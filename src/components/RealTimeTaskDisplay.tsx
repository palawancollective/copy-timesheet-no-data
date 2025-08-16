import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, User, TrendingUp, Home } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  hourly_rate: number;
}

interface TaskWithEmployee {
  id: string;
  employee_id: string;
  task_description: string;
  is_completed: boolean;
  completed_at: string | null;
  assigned_date: string;
  priority: number;
  employees: Employee;
}

interface ClockedInEmployeeWithTasks {
  employee: Employee;
  timeEntry: {
    id: string;
    clock_in: string;
    clock_out: string | null;
  };
  incompleteTasks: TaskWithEmployee[];
}

interface TaskSummary {
  employee: Employee;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  recentCompletions: TaskWithEmployee[];
}

export const RealTimeTaskDisplay: React.FC<{ onGoHome?: () => void }> = ({ onGoHome }) => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's clocked-in employees
  const { data: clockedInEmployees = [] } = useQuery({
    queryKey: ['clockedInEmployees', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          id,
          employee_id,
          clock_in,
          clock_out,
          employees (id, name, hourly_rate)
        `)
        .eq('entry_date', today)
        .not('clock_in', 'is', null);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch today's incomplete tasks for clocked-in employees
  const { data: allTasks = [] } = useQuery({
    queryKey: ['incompleteTasks', today, clockedInEmployees],
    queryFn: async () => {
      if (clockedInEmployees.length === 0) return [];
      
      const employeeIds = clockedInEmployees.map(entry => entry.employee_id);
      
      const { data, error } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          employees (id, name, hourly_rate)
        `)
        .eq('assigned_date', today)
        .eq('is_completed', false)
        .in('employee_id', employeeIds)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return data as TaskWithEmployee[];
    },
    enabled: clockedInEmployees.length > 0
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('clocked-in-task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['incompleteTasks', today, clockedInEmployees] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clockedInEmployees', today] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, today, clockedInEmployees]);

  // Process clocked-in employees with their incomplete tasks
  const clockedInWithTasks: ClockedInEmployeeWithTasks[] = React.useMemo(() => {
    return clockedInEmployees.map(timeEntry => {
      const employeeTasks = allTasks.filter(task => task.employee_id === timeEntry.employee_id);
      
      return {
        employee: timeEntry.employees,
        timeEntry: {
          id: timeEntry.id,
          clock_in: timeEntry.clock_in,
          clock_out: timeEntry.clock_out
        },
        incompleteTasks: employeeTasks
      };
    });
  }, [clockedInEmployees, allTasks]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getClockStatus = (clockIn: string, clockOut: string | null) => {
    if (clockOut) {
      return { text: "Clocked Out", variant: "secondary" as const };
    }
    return { text: "Currently Working", variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Employees Clocked In Today
            </span>
            <Badge variant="outline">
              {clockedInWithTasks.length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Clocked-in Employees with Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clockedInWithTasks.map((employeeData) => {
          const status = getClockStatus(employeeData.timeEntry.clock_in, employeeData.timeEntry.clock_out);
          
          return (
            <Card key={employeeData.employee.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {employeeData.employee.name}
                  </span>
                  <Badge variant={status.variant} className="text-xs">
                    {status.text}
                  </Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Clocked in: {formatTime(employeeData.timeEntry.clock_in)}
                  {employeeData.timeEntry.clock_out && (
                    <div>Clocked out: {formatTime(employeeData.timeEntry.clock_out)}</div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Pending Tasks: {employeeData.incompleteTasks.length}</span>
                </div>
                
                {employeeData.incompleteTasks.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Current Tasks:</p>
                    {employeeData.incompleteTasks.map((task) => (
                      <div key={task.id} className="p-2 bg-muted rounded-lg">
                        <div className="text-sm font-medium">{task.task_description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Priority: {task.priority}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
                    <p className="text-sm text-muted-foreground">All tasks completed!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {clockedInWithTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No employees clocked in today</p>
          </CardContent>
        </Card>
      )}

      {/* Go Home Button */}
      {onGoHome && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={onGoHome} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Clock-In
          </Button>
        </div>
      )}
    </div>
  );
};