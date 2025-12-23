import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, X, Edit, Trash2, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
}

interface EmployeeTaskManagerProps {
  employee: Employee;
  isAdminMode?: boolean;
}

export const EmployeeTaskManager: React.FC<EmployeeTaskManagerProps> = ({ employee, isAdminMode = false }) => {
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('1');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [editHourlyRate, setEditHourlyRate] = useState(employee.hourly_rate.toString());
  const [currentRate, setCurrentRate] = useState(employee.hourly_rate);
  const queryClient = useQueryClient();

  // Sync local state when employee prop changes
  React.useEffect(() => {
    setCurrentRate(employee.hourly_rate);
    setEditHourlyRate(employee.hourly_rate.toString());
  }, [employee.hourly_rate]);

  const getManilaDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"})).toISOString();
  };

  // Fetch employee tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['employeeTasks', employee.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_tasks')
        .select('*')
        .eq('employee_id', employee.id)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    }
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async ({ description, priority }: { description: string; priority: number }) => {
      const { error } = await supabase
        .from('employee_tasks')
        .insert({
          employee_id: employee.id,
          task_description: description,
          priority,
          assigned_date: new Date().toISOString().split('T')[0]
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeTasks', employee.id] });
      setNewTaskDescription('');
      setNewTaskPriority('1');
      toast({ title: "Task added successfully!" });
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
      queryClient.invalidateQueries({ queryKey: ['employeeTasks', employee.id] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      toast({ title: "Task updated successfully!" });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, description }: { taskId: string; description: string }) => {
      const { error } = await supabase
        .from('employee_tasks')
        .update({ 
          task_description: description,
          updated_at: getManilaDateTime()
        })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeTasks', employee.id] });
      setEditingTask(null);
      setEditTaskDescription('');
      toast({ title: "Task updated successfully!" });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('employee_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeTasks', employee.id] });
      toast({ title: "Task deleted successfully!" });
    }
  });

  // Update hourly rate mutation
  const updateHourlyRateMutation = useMutation({
    mutationFn: async (newRate: number) => {
      const { error } = await supabase
        .from('employees')
        .update({ hourly_rate: newRate })
        .eq('id', employee.id);
      
      if (error) throw error;
      return newRate;
    },
    onSuccess: (newRate) => {
      // Update local state immediately
      setCurrentRate(newRate);
      setEditHourlyRate(newRate.toString());
      setIsEditingRate(false);
      
      // Invalidate all related queries to refresh everywhere
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['todayTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['activeTimeEntries'] });
      
      toast({ title: 'Hourly rate updated successfully!' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update hourly rate', description: err?.message, variant: 'destructive' });
    }
  });

  // Delete employee & all related data (tasks, schedules, time entries, payment notes)
  const deleteEmployeeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_employee_and_related', {
        employee_id_param: employee.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Refresh lists everywhere
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeTasks', employee.id] });
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      toast({ title: 'Employee and all related data deleted.' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to delete employee', description: err?.message, variant: 'destructive' });
    }
  });

  const handleUpdateHourlyRate = () => {
    const rate = parseFloat(editHourlyRate);
    if (isNaN(rate) || rate < 0) {
      toast({ title: 'Please enter a valid hourly rate', variant: 'destructive' });
      return;
    }
    updateHourlyRateMutation.mutate(rate);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;
    
    addTaskMutation.mutate({
      description: newTaskDescription.trim(),
      priority: parseInt(newTaskPriority)
    });
  };

  const handleToggleTask = (taskId: string, isCompleted: boolean) => {
    toggleTaskMutation.mutate({ taskId, isCompleted });
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditTaskDescription(task.task_description);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !editTaskDescription.trim()) return;
    
    updateTaskMutation.mutate({
      taskId: editingTask,
      description: editTaskDescription.trim()
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const totalTasks = tasks.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>{employee.name}</span>
              <Badge variant={completedTasks === totalTasks && totalTasks > 0 ? "default" : "secondary"}>
                {completedTasks}/{totalTasks}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Hourly Rate: ₱{currentRate}/hour</p>
              <p>Tasks: {completedTasks} of {totalTasks} completed</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Task Management - {employee.name}
            </DialogTitle>
            {isAdminMode && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Employee
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {employee.name} and all data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes this employee and all time entries, tasks, schedules, and payment notes. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteEmployeeMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hourly Rate Section - Admin Only */}
          {isAdminMode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payroll Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Hourly Rate:</Label>
                  {isEditingRate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">₱</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editHourlyRate}
                        onChange={(e) => setEditHourlyRate(e.target.value)}
                        className="w-28"
                      />
                      <Button
                        size="sm"
                        onClick={handleUpdateHourlyRate}
                        disabled={updateHourlyRateMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingRate(false);
                          setEditHourlyRate(currentRate.toString());
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">₱{currentRate}/hour</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingRate(true);
                          setEditHourlyRate(currentRate.toString());
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Task - Admin Only */}
          {isAdminMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="taskDescription">Task Description</Label>
                    <Input
                      id="taskDescription"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Enter task description"
                      required
                    />
                  </div>
                  <div className="w-full sm:w-24">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={addTaskMutation.isPending}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    >
                      Add Task
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile View */}
              <div className="block md:hidden">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">Priority {task.priority}</span>
                            <Button
                              size="sm"
                              variant={task.is_completed ? "default" : "outline"}
                              onClick={() => handleToggleTask(task.id, task.is_completed)}
                              className="h-6 px-2 text-xs"
                            >
                              {task.is_completed ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Done
                                </>
                              ) : (
                                '☐ Pending'
                              )}
                            </Button>
                          </div>
                          {editingTask === task.id ? (
                            <div className="flex gap-1">
                              <Input
                                value={editTaskDescription}
                                onChange={(e) => setEditTaskDescription(e.target.value)}
                                className="text-xs"
                              />
                              <Button
                                size="sm"
                                onClick={handleUpdateTask}
                                disabled={updateTaskMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 h-8 px-2"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingTask(null);
                                  setEditTaskDescription('');
                                }}
                                className="h-8 px-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className={task.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                                {task.task_description}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-2 pt-2 border-t">
                        <span>
                          {task.completed_at ? `Completed: ${formatTime(task.completed_at)}` : 'Not completed'}
                        </span>
                        <div className="flex gap-1">
                          {editingTask !== task.id && isAdminMode && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(task)}
                                className="h-6 px-1"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 h-6 px-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this task? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteTaskMutation.mutate(task.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
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
                      <TableHead className="w-12">Priority</TableHead>
                      <TableHead>Task Description</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-32">Completed At</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.priority}</TableCell>
                        <TableCell>
                          {editingTask === task.id ? (
                            <Input
                              value={editTaskDescription}
                              onChange={(e) => setEditTaskDescription(e.target.value)}
                              className="w-full"
                            />
                          ) : (
                            <span className={task.is_completed ? 'line-through text-gray-500' : ''}>
                              {task.task_description}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={task.is_completed ? "default" : "outline"}
                            onClick={() => handleToggleTask(task.id, task.is_completed)}
                            className="w-full"
                          >
                            {task.is_completed ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Done
                              </>
                            ) : (
                              '☐ Pending'
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {formatTime(task.completed_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {editingTask === task.id && isAdminMode ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={handleUpdateTask}
                                  disabled={updateTaskMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingTask(null);
                                    setEditTaskDescription('');
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : isAdminMode ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(task)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this task? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTaskMutation.mutate(task.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};