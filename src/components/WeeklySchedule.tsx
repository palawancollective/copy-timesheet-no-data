import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, Edit, Trash2, Copy, MoreHorizontal, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface ShiftModalData {
  employee_id: string;
  date: string;
  time_in: string;
  time_out: string;
  schedule_id?: string;
}

// Common shift presets
const SHIFT_PRESETS = [
  { label: 'Morning Shift', time_in: '07:00', time_out: '15:00' },
  { label: 'Day Shift', time_in: '09:00', time_out: '17:00' },
  { label: 'Evening Shift', time_in: '15:00', time_out: '23:00' },
  { label: 'Night Shift', time_in: '23:00', time_out: '07:00' },
];

export const WeeklySchedule: React.FC = () => {
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftModalData, setShiftModalData] = useState<ShiftModalData>({
    employee_id: '',
    date: '',
    time_in: '09:00',
    time_out: '17:00'
  });
  const [draggedSchedule, setDraggedSchedule] = useState<Schedule | null>(null);
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
        dayNumber: date.getDate(),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
    refetchInterval: 3000 // Real-time updates every 3 seconds
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
      setIsShiftModalOpen(false);
      setShiftModalData({
        employee_id: '',
        date: '',
        time_in: '09:00',
        time_out: '17:00'
      });
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
      setIsShiftModalOpen(false);
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

  const openShiftModal = (employeeId: string, date: string, schedule?: Schedule) => {
    setShiftModalData({
      employee_id: employeeId,
      date: date,
      time_in: schedule?.time_in || '09:00',
      time_out: schedule?.time_out || '17:00',
      schedule_id: schedule?.id
    });
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = () => {
    if (!shiftModalData.employee_id || !shiftModalData.date || !shiftModalData.time_in || !shiftModalData.time_out) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (shiftModalData.time_in >= shiftModalData.time_out) {
      toast({ title: "Time out must be after time in", variant: "destructive" });
      return;
    }

    if (shiftModalData.schedule_id) {
      // Update existing schedule
      updateScheduleMutation.mutate({
        id: shiftModalData.schedule_id,
        updates: {
          employee_id: shiftModalData.employee_id,
          schedule_date: shiftModalData.date,
          time_in: shiftModalData.time_in,
          time_out: shiftModalData.time_out
        }
      });
    } else {
      // Add new schedule
      addScheduleMutation.mutate({
        employee_id: shiftModalData.employee_id,
        schedule_date: shiftModalData.date,
        time_in: shiftModalData.time_in,
        time_out: shiftModalData.time_out
      });
    }
  };

  const getSchedulesForEmployeeAndDate = (employeeId: string, date: string) => {
    return schedules.filter(schedule => 
      schedule.employee_id === employeeId && schedule.schedule_date === date
    );
  };

  const copyShiftToOtherDays = (schedule: Schedule) => {
    const shiftsToAdd = weekDates
      .filter(day => day.date !== schedule.schedule_date)
      .map(day => ({
        employee_id: schedule.employee_id,
        schedule_date: day.date,
        time_in: schedule.time_in,
        time_out: schedule.time_out
      }));

    Promise.all(
      shiftsToAdd.map(shift => 
        supabase.from('weekly_schedules').insert(shift)
      )
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      toast({ title: "Shift copied to all days this week!" });
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDragStart = (e: React.DragEvent, schedule: Schedule) => {
    setDraggedSchedule(schedule);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, employeeId: string, date: string) => {
    e.preventDefault();
    if (draggedSchedule && draggedSchedule.employee_id !== employeeId) {
      // Move schedule to different employee
      updateScheduleMutation.mutate({
        id: draggedSchedule.id,
        updates: {
          employee_id: employeeId,
          schedule_date: date
        }
      });
    } else if (draggedSchedule && draggedSchedule.schedule_date !== date) {
      // Move schedule to different date
      updateScheduleMutation.mutate({
        id: draggedSchedule.id,
        updates: {
          schedule_date: date
        }
      });
    }
    setDraggedSchedule(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Weekly Schedule Manager
            </div>
            <div className="text-sm text-muted-foreground">
              Week of {weekDates[0]?.fullDate} - {weekDates[6]?.fullDate}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Fixed Responsive Grid Layout - No Horizontal Scroll */}
          <div className="w-full">
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-1 sm:gap-2 mb-4">
              <div className="p-1 sm:p-3 font-semibold text-center bg-muted rounded text-xs sm:text-sm">
                <User className="h-3 w-3 sm:h-4 sm:w-4 mx-auto mb-1" />
                <span className="hidden sm:inline">Employee</span>
                <span className="sm:hidden">Emp</span>
              </div>
              {weekDates.map((day) => (
                <div key={day.date} className="p-1 sm:p-3 text-center bg-muted rounded">
                  <div className="font-semibold text-xs sm:text-sm">{day.dayName}</div>
                  <div className="text-xs text-muted-foreground">{day.dayNumber}</div>
                </div>
              ))}
            </div>

            {/* Employee Rows */}
            {employees.map((employee) => (
              <div key={employee.id} className="grid grid-cols-8 gap-1 sm:gap-2 mb-3">
                {/* Employee Name Column */}
                <div className="p-1 sm:p-3 bg-card border rounded flex items-center">
                  <div className="font-medium truncate text-xs sm:text-sm">{employee.name}</div>
                </div>

                {/* Daily Schedule Columns */}
                {weekDates.map((day) => {
                  const daySchedules = getSchedulesForEmployeeAndDate(employee.id, day.date);
                  
                  return (
                    <div
                      key={`${employee.id}-${day.date}`}
                      className="min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 bg-card border rounded relative hover:bg-accent/50 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, employee.id, day.date)}
                    >
                      {daySchedules.length === 0 ? (
                        // Empty cell - click to add shift
                        <button
                          onClick={() => openShiftModal(employee.id, day.date)}
                          className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      ) : (
                        // Show schedules
                        <div className="space-y-1">
                          {daySchedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, schedule)}
                              className="bg-primary/10 border border-primary/20 rounded p-1 sm:p-2 text-xs cursor-move hover:bg-primary/20 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <Clock className="h-2 w-2 sm:h-3 sm:w-3 inline mr-1" />
                                  <span className="font-medium text-xs">
                                    <span className="hidden sm:inline">
                                      {formatTime(schedule.time_in)} - {formatTime(schedule.time_out)}
                                    </span>
                                    <span className="sm:hidden">
                                      {schedule.time_in.slice(0, 5)}-{schedule.time_out.slice(0, 5)}
                                    </span>
                                  </span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 sm:h-6 sm:w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreHorizontal className="h-2 w-2 sm:h-3 sm:w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => openShiftModal(employee.id, day.date, schedule)}
                                    >
                                      <Edit className="h-3 w-3 mr-2" />
                                      Edit Shift
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => copyShiftToOtherDays(schedule)}
                                    >
                                      <Copy className="h-3 w-3 mr-2" />
                                      Copy to Week
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shift Modal */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {shiftModalData.schedule_id ? 'Edit Shift' : 'Add New Shift'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Select
                value={shiftModalData.employee_id}
                onValueChange={(value) => setShiftModalData(prev => ({ ...prev, employee_id: value }))}
              >
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
              <Label>Date</Label>
              <Input
                type="date"
                value={shiftModalData.date}
                onChange={(e) => setShiftModalData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Time In</Label>
                <Input
                  type="time"
                  value={shiftModalData.time_in}
                  onChange={(e) => setShiftModalData(prev => ({ ...prev, time_in: e.target.value }))}
                />
              </div>
              <div>
                <Label>Time Out</Label>
                <Input
                  type="time"
                  value={shiftModalData.time_out}
                  onChange={(e) => setShiftModalData(prev => ({ ...prev, time_out: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SHIFT_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setShiftModalData(prev => ({
                      ...prev,
                      time_in: preset.time_in,
                      time_out: preset.time_out
                    }))}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsShiftModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveShift}
                disabled={addScheduleMutation.isPending || updateScheduleMutation.isPending}
              >
                {shiftModalData.schedule_id ? 'Update' : 'Add'} Shift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};