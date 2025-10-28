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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Daily Task Assignment
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(today).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Badge>
            {totalAssignments > 0 && (
              <Badge variant="default" className="text-sm px-3 py-1">
                {totalAssignments} selected
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Assign daily tasks to employees. Tasks will appear in their clock-in view.
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {taskTemplates.map((template) => {
              const selectedEmployees = taskAssignments.get(template.id) || new Set<string>();
              
              return (
                <Card key={template.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <Badge variant="outline" className="text-xs">
                          {template.time_slot}
                        </Badge>
                        <p className="text-sm font-medium leading-relaxed">
                          {template.task_description}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleSelectAllForTask(template.id)}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleClearAllForTask(template.id)}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {employees.map(employee => {
                        const isChecked = selectedEmployees.has(employee.id);
                        const alreadyAssigned = isTaskAssignedToEmployee(template.task_description, employee.id);
                        
                        return (
                          <div 
                            key={employee.id} 
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                              isChecked ? 'bg-primary/10 border-primary' : 
                              alreadyAssigned ? 'bg-muted border-muted' : 
                              'hover:bg-accent'
                            }`}
                          >
                            <Checkbox
                              id={`${template.id}-${employee.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(template.id, employee.id, checked as boolean)
                              }
                              disabled={alreadyAssigned}
                            />
                            <label
                              htmlFor={`${template.id}-${employee.id}`}
                              className="flex-1 text-sm cursor-pointer truncate"
                              title={employee.name}
                            >
                              {employee.name}
                            </label>
                            {alreadyAssigned && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                ✓
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Assign Button */}
        <div className="flex justify-center sm:justify-end pt-4 mt-4 border-t">
          <Button
            onClick={handleAssignTasks}
            disabled={assignTasksMutation.isPending || totalAssignments === 0}
            size="lg"
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            <Users className="h-5 w-5 mr-2" />
            Assign {totalAssignments} Task{totalAssignments !== 1 ? 's' : ''} to Employees
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
