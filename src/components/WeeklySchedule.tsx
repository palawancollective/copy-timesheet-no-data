import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, Edit, Trash2, Save, X } from 'lucide-react';
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

interface Employee {
  id: string;
  name: string;
  hourly_rate: number;
}

interface Schedule {
  id: string;
  employee_id: string;
  schedule_date: string;
  time_in: string;
  time_out: string;
  created_at: string;
  updated_at: string;
  employees: {
    name: string;
  };
}

export const WeeklySchedule: React.FC = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeIn, setTimeIn] = useState<string>('');
  const [timeOut, setTimeOut] = useState<string>('');
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const queryClient = useQueryClient();

  // Get current week's Sunday
  const getCurrentWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  // Get week dates (Sunday to Saturday)
  const getWeekDates = () => {
    const weekStart = getCurrentWeekStart();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate()
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();

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

  // Fetch weekly schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ['weeklySchedules'],
    queryFn: async () => {
      const weekStart = getCurrentWeekStart();
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
      
      if (error) throw error;
      return data as Schedule[];
    },
    refetchInterval: 5000 // Real-time updates every 5 seconds
  });

  // Add schedule mutation
  const addScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const { error } = await supabase
        .from('weekly_schedules')
        .insert(scheduleData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      setSelectedEmployeeId('');
      setSelectedDate('');
      setTimeIn('');
      setTimeOut('');
      toast({ title: "Schedule added successfully!" });
    }
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('weekly_schedules')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      setEditingSchedule(null);
      setEditForm({});
      toast({ title: "Schedule updated successfully!" });
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weekly_schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({ title: "Schedule deleted successfully!" });
    }
  });

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedDate || !timeIn || !timeOut) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (timeIn >= timeOut) {
      toast({ title: "Time out must be after time in", variant: "destructive" });
      return;
    }

    addScheduleMutation.mutate({
      employee_id: selectedEmployeeId,
      schedule_date: selectedDate,
      time_in: timeIn,
      time_out: timeOut
    });
  };

  const startEditing = (schedule: Schedule) => {
    setEditingSchedule(schedule.id);
    setEditForm({
      employee_id: schedule.employee_id,
      schedule_date: schedule.schedule_date,
      time_in: schedule.time_in,
      time_out: schedule.time_out
    });
  };

  const handleSubmitEdit = () => {
    if (!editingSchedule) return;

    if (editForm.time_in >= editForm.time_out) {
      toast({ title: "Time out must be after time in", variant: "destructive" });
      return;
    }

    updateScheduleMutation.mutate({
      id: editingSchedule,
      updates: editForm
    });
  };

  const cancelEdit = () => {
    setEditingSchedule(null);
    setEditForm({});
  };

  const handleDeleteSchedule = (id: string) => {
    deleteScheduleMutation.mutate(id);
  };

  const getSchedulesForDate = (date: string) => {
    return schedules.filter(schedule => schedule.schedule_date === date);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Weekly Schedule Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Schedule Form */}
          <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
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
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="timeIn">Time In</Label>
              <Input
                type="time"
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="timeOut">Time Out</Label>
              <Input
                type="time"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={addScheduleMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </form>

          {/* Weekly Schedule Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {weekDates.map((dayInfo) => (
              <Card key={dayInfo.date} className="min-h-40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-center">
                    <div className="font-bold">{dayInfo.dayName}</div>
                    <div className="text-xs text-gray-600">{dayInfo.dayNumber}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {getSchedulesForDate(dayInfo.date).map((schedule) => {
                      const isEditing = editingSchedule === schedule.id;
                      
                      return (
                        <div key={schedule.id} className="bg-blue-50 rounded p-2 text-xs">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Select
                                value={editForm.employee_id}
                                onValueChange={(value) => setEditForm({...editForm, employee_id: value})}
                              >
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {employees.map((employee) => (
                                    <SelectItem key={employee.id} value={employee.id}>
                                      {employee.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="time"
                                value={editForm.time_in}
                                onChange={(e) => setEditForm({...editForm, time_in: e.target.value})}
                                className="h-6 text-xs"
                              />
                              <Input
                                type="time"
                                value={editForm.time_out}
                                onChange={(e) => setEditForm({...editForm, time_out: e.target.value})}
                                className="h-6 text-xs"
                              />
                              <div className="flex gap-1">
                                <Button
                                  onClick={handleSubmitEdit}
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  disabled={updateScheduleMutation.isPending}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={cancelEdit}
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium text-blue-800">{schedule.employees.name}</div>
                              <div className="text-blue-600">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatTime(schedule.time_in)} - {formatTime(schedule.time_out)}
                              </div>
                              <div className="flex gap-1 mt-1">
                                <Button
                                  onClick={() => startEditing(schedule)}
                                  size="sm"
                                  variant="outline"
                                  className="h-5 px-1 text-xs"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-5 px-1 text-xs text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this schedule for {schedule.employees.name}?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};