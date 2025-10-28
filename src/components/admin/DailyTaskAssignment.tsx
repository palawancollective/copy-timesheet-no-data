import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Users, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Employee {
  id: string;
  name: string;
}

interface TaskTemplate {
  id: string;
  time_slot: string;
  task_description: string;
  order_index: number;
  is_active: boolean;
}

interface TaskAssignment {
  templateId: string;
  employeeIds: string[];
}

export const DailyTaskAssignment: React.FC = () => {
  const [taskAssignments, setTaskAssignments] = useState<Map<string, Set<string>>>(new Map());
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  // Fetch all employees
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

  // Fetch task templates
  const { data: taskTemplates = [] } = useQuery({
    queryKey: ['taskTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      if (error) throw error;
      return data as TaskTemplate[];
    }
  });

  // Fetch today's existing task assignments
  const { data: existingTasks = [] } = useQuery({
    queryKey: ['todaysAssignments', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_tasks')
        .select('employee_id, task_description')
        .eq('assigned_date', today);
      
      if (error) throw error;
      return data as { employee_id: string; task_description: string }[];
    }
  });

  // Assign tasks mutation
  const assignTasksMutation = useMutation({
    mutationFn: async (assignments: TaskAssignment[]) => {
      const tasksToInsert = assignments.flatMap(({ templateId, employeeIds }) => {
        const template = taskTemplates.find(t => t.id === templateId);
        if (!template) return [];
        
        return employeeIds.map(employeeId => ({
          employee_id: employeeId,
          task_description: template.task_description,
          assigned_date: today,
          priority: template.order_index,
          is_completed: false
        }));
      });

      if (tasksToInsert.length === 0) {
        throw new Error('No tasks to assign');
      }

      const { error } = await supabase
        .from('employee_tasks')
        .insert(tasksToInsert);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaysAssignments', today] });
      queryClient.invalidateQueries({ queryKey: ['todaysTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      setTaskAssignments(new Map());
      toast({ 
        title: "Tasks assigned successfully!",
        description: "Employees can now see their tasks in the clock-in view."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to assign tasks",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCheckboxChange = (templateId: string, employeeId: string, checked: boolean) => {
    setTaskAssignments(prev => {
      const newMap = new Map(prev);
      const employeeSet = newMap.get(templateId) || new Set<string>();
      
      if (checked) {
        employeeSet.add(employeeId);
      } else {
        employeeSet.delete(employeeId);
      }
      
      if (employeeSet.size > 0) {
        newMap.set(templateId, employeeSet);
      } else {
        newMap.delete(templateId);
      }
      
      return newMap;
    });
  };

  const handleSelectAllForTask = (templateId: string) => {
    setTaskAssignments(prev => {
      const newMap = new Map(prev);
      const allEmployeeIds = new Set(employees.map(e => e.id));
      newMap.set(templateId, allEmployeeIds);
      return newMap;
    });
  };

  const handleClearAllForTask = (templateId: string) => {
    setTaskAssignments(prev => {
      const newMap = new Map(prev);
      newMap.delete(templateId);
      return newMap;
    });
  };

  const handleAssignTasks = () => {
    const assignments: TaskAssignment[] = Array.from(taskAssignments.entries()).map(
      ([templateId, employeeIds]) => ({
        templateId,
        employeeIds: Array.from(employeeIds)
      })
    );

    if (assignments.length === 0) {
      toast({
        title: "No tasks selected",
        description: "Please select at least one task and employee",
        variant: "destructive"
      });
      return;
    }

    assignTasksMutation.mutate(assignments);
  };

  const isTaskAssignedToEmployee = (taskDescription: string, employeeId: string) => {
    return existingTasks.some(
      t => t.task_description === taskDescription && t.employee_id === employeeId
    );
  };

  const totalAssignments = Array.from(taskAssignments.values()).reduce(
    (sum, set) => sum + set.size,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Daily Task Assignment
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-base px-3 py-1">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(today).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Badge>
            {totalAssignments > 0 && (
              <Badge variant="default" className="text-base px-3 py-1">
                {totalAssignments} assignments selected
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Assign daily tasks to employees. Tasks will appear in their clock-in view.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Employee Header */}
          <div className="flex items-center gap-2 pb-2 border-b sticky top-0 bg-background z-10">
            <div className="w-16 font-semibold text-sm">Time</div>
            <div className="flex-1 font-semibold text-sm">Task Description</div>
            <div className="flex gap-2">
              {employees.map(employee => (
                <div key={employee.id} className="w-24 text-center">
                  <div className="text-xs font-semibold truncate" title={employee.name}>
                    {employee.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks with checkboxes */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {taskTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="w-16 text-xs font-medium text-muted-foreground shrink-0">
                    {template.time_slot}
                  </div>
                  <div className="flex-1 text-sm">
                    {template.task_description}
                    <div className="mt-1 flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleSelectAllForTask(template.id)}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleClearAllForTask(template.id)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {employees.map(employee => {
                      const isChecked = taskAssignments.get(template.id)?.has(employee.id) || false;
                      const alreadyAssigned = isTaskAssignedToEmployee(template.task_description, employee.id);
                      
                      return (
                        <div key={employee.id} className="w-24 flex justify-center items-center">
                          <div className="flex flex-col items-center gap-1">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(template.id, employee.id, checked as boolean)
                              }
                              disabled={alreadyAssigned}
                            />
                            {alreadyAssigned && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Assigned
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Assign Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleAssignTasks}
              disabled={assignTasksMutation.isPending || totalAssignments === 0}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <Users className="h-5 w-5 mr-2" />
              Assign {totalAssignments} Task{totalAssignments !== 1 ? 's' : ''} to Employees
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
