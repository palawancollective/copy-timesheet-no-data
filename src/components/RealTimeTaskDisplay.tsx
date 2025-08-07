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

  // Fetch all today's tasks with employee info
  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasks', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          employees (id, name, hourly_rate)
        `)
        .eq('assigned_date', today)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as TaskWithEmployee[];
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('all-task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['allTasks', today] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, today]);

  // Process task data by employee
  const taskSummaries: TaskSummary[] = React.useMemo(() => {
    const employeeMap = new Map<string, TaskSummary>();

    allTasks.forEach(task => {
      const employeeId = task.employee_id;
      
      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          employee: task.employees,
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
          recentCompletions: []
        });
      }

      const summary = employeeMap.get(employeeId)!;
      summary.totalTasks++;
      
      if (task.is_completed) {
        summary.completedTasks++;
        if (task.completed_at) {
          summary.recentCompletions.push(task);
        }
      }
    });

    // Calculate completion rates and sort recent completions
    employeeMap.forEach(summary => {
      summary.completionRate = summary.totalTasks > 0 
        ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
        : 0;
      
      summary.recentCompletions = summary.recentCompletions
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
        .slice(0, 3); // Show only the 3 most recent completions
    });

    return Array.from(employeeMap.values())
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [allTasks]);

  const recentCompletions = allTasks
    .filter(task => task.is_completed && task.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 5);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const totalTasks = allTasks.length;
  const totalCompleted = allTasks.filter(task => task.is_completed).length;
  const overallProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Today's Overall Progress
            </span>
            <Badge variant={overallProgress === 100 ? "default" : "secondary"}>
              {totalCompleted}/{totalTasks} Tasks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>


      {/* Employee Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taskSummaries.map((summary) => (
          <Card key={summary.employee.id} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {summary.employee.name}
                </span>
                <Badge 
                  variant={summary.completionRate === 100 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {summary.completionRate}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Tasks: {summary.completedTasks}/{summary.totalTasks}</span>
              </div>
              <Progress value={summary.completionRate} className="h-2" />
              
              {summary.recentCompletions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Recent completions:</p>
                  {summary.recentCompletions.map((task) => (
                    <div key={task.id} className="text-xs text-gray-500 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      <span className="truncate flex-1">{task.task_description}</span>
                      <span className="ml-1">{formatTime(task.completed_at!)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Feed */}
      {recentCompletions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Task Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCompletions.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{task.employees.name}</p>
                      <p className="text-sm text-gray-600">{task.task_description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(task.completed_at!)}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {totalTasks === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No tasks assigned for today</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};