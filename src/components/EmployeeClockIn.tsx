import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, Circle, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  name: string;
  hourly_rate: number;
}

interface Task {
  id: string;
  employee_id: string;
  task_description: string;
  is_completed: boolean;
  completed_at: string | null;
  assigned_date: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface TimeEntry {
  id: string;
  employee_id: string;
  entry_date: string;
  clock_in: string | null;
  clock_out: string | null;
}

export const EmployeeClockIn: React.FC = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get Manila timezone helpers
  const getManilaDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"})).toISOString();
  };

  const formatManilaTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
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
      return data as Employee[];
    }
  });

  // Fetch today's tasks for selected employee (show both today's and unfinished previous tasks)
  const { data: todaysTasks = [] } = useQuery({
    queryKey: ['todaysTasks', selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('employee_tasks')
        .select('*')
        .eq('employee_id', selectedEmployeeId)
        .or(`assigned_date.eq.${today},and(assigned_date.lt.${today},is_completed.eq.false)`)
        .order('assigned_date', { ascending: false })
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!selectedEmployeeId,
    refetchInterval: 5000 // Refetch every 5 seconds for real-time updates
  });

  // Check if employee is already clocked in today
  const { data: todaysTimeEntry } = useQuery({
    queryKey: ['todaysTimeEntry', selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', selectedEmployeeId)
        .eq('entry_date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data as TimeEntry | null;
    },
    enabled: !!selectedEmployeeId
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const now = getManilaDateTime();
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('time_entries')
        .insert({
          employee_id: employeeId,
          entry_date: today,
          clock_in: now
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaysTimeEntry', selectedEmployeeId] });
      toast({ title: "Successfully clocked in!" });
    }
  });

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      const updates = {
        is_completed: !isCompleted,
        completed_at: !isCompleted ? getManilaDateTime() : null,
        updated_at: getManilaDateTime()
      };

      const { error } = await supabase
        .from('employee_tasks')
        .update(updates)
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaysTasks', selectedEmployeeId] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      toast({ title: "Task updated successfully!" });
    }
  });

  // Set up real-time subscription for task updates
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const channel = supabase
      .channel('task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_tasks',
          filter: `employee_id=eq.${selectedEmployeeId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['todaysTasks', selectedEmployeeId] });
          queryClient.invalidateQueries({ queryKey: ['allTasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEmployeeId, queryClient]);

  const handleClockIn = () => {
    if (!selectedEmployeeId) return;
    clockInMutation.mutate(selectedEmployeeId);
  };

  const handleToggleTask = (taskId: string, isCompleted: boolean) => {
    toggleTaskMutation.mutate({ taskId, isCompleted });
  };

  const formatCompletionTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const completedTasks = todaysTasks.filter(task => task.is_completed).length;
  const totalTasks = todaysTasks.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-2xl">
            <Clock className="h-6 w-6 mr-2" />
            Employee Clock-In System
          </CardTitle>
          <div className="text-center text-lg font-mono">
            {formatManilaTime(currentTime)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-xs">
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {employee.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEmployee && !todaysTimeEntry && (
              <Button
                onClick={handleClockIn}
                disabled={clockInMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
              >
                Clock In Now
              </Button>
            )}
            
            {todaysTimeEntry && (
              <div className="text-center">
                <Badge variant="default" className="text-lg px-4 py-2">
                  ✅ Already Clocked In Today
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Clocked in at: {new Date(todaysTimeEntry.clock_in!).toLocaleString('en-US', {
                    timeZone: 'Asia/Manila',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      {selectedEmployee && todaysTimeEntry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Tasks for Today</span>
              <Badge variant={completedTasks === totalTasks && totalTasks > 0 ? "default" : "secondary"}>
                {completedTasks}/{totalTasks} Completed
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Please mark each task as completed and record the completion time.
            </p>
          </CardHeader>
          <CardContent>
            {/* Mobile View */}
            <div className="block md:hidden">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {todaysTasks.map((task, index) => (
                  <div key={task.id} className={`bg-gray-50 rounded-lg p-3 border ${task.is_completed ? 'bg-green-50' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleTask(task.id, task.is_completed)}
                            className="p-1 h-6"
                          >
                            {task.is_completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        <div className="text-sm">
                          <span className={task.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                            {task.task_description}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                      {task.completed_at ? `Completed: ${formatCompletionTime(task.completed_at)}` : 'Not completed yet'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead className="w-24 text-center">Completed</TableHead>
                    <TableHead className="w-32 text-center">Time Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysTasks.map((task, index) => (
                    <TableRow key={task.id} className={task.is_completed ? 'bg-green-50' : ''}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className={task.is_completed ? 'line-through text-gray-500' : ''}>
                        {task.task_description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleTask(task.id, task.is_completed)}
                          className="p-1"
                        >
                          {task.is_completed ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCompletionTime(task.completed_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalTasks === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks assigned for today
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Click the circle (○) when you complete a task - it will turn into a checkmark (✅)</li>
                <li>• The completion time will be automatically recorded</li>
                <li>• Ensure all tasks are completed before the end of your shift</li>
                <li>• Contact your supervisor if you need help with any task</li>
              </ul>
              <p className="text-sm font-medium text-blue-700 mt-3">
                Have a productive day! 🌟
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};