import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Clock, Plus, CheckCircle, Circle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuickClockInModalProps {
  onSuccess?: () => void;
}

const SHIFT_PRESETS = [
  { label: 'Half Day (4h)', hours: 4, description: '9:00 AM - 1:00 PM' },
  { label: 'Full Day (8h)', hours: 8, description: '9:00 AM - 5:00 PM' },
  { label: 'Custom', hours: 0, description: 'Set custom times' }
];

export const QuickClockInModal: React.FC<QuickClockInModalProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('');
  const [customClockIn, setCustomClockIn] = useState('09:00');
  const [customClockOut, setCustomClockOut] = useState('17:00');
  const queryClient = useQueryClient();

  // Fetch tasks for selected employee
  const { data: employeeTasks = [] } = useQuery({
    queryKey: ['employeeTasks', selectedEmployee],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      
      const { data, error } = await supabase
        .from('employee_tasks')
        .select('*')
        .eq('employee_id', selectedEmployee)
        .eq('assigned_date', selectedDate)
        .order('priority');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployee
  });

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

  // Get Manila timezone helpers
  const getManilaDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
  };

  const createTimeEntry = useMutation({
    mutationFn: async (entryData: any) => {
      const { error } = await supabase
        .from('time_entries')
        .insert(entryData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      queryClient.invalidateQueries({ queryKey: ['allActivities'] });
      queryClient.invalidateQueries({ queryKey: ['todaysTimeEntry'] });
      toast({ title: "Employee clocked in successfully!" });
      setIsOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating time entry:', error);
      toast({ 
        title: "Error clocking in employee", 
        description: "Please check your inputs and try again.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedEmployee('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedShift('');
    setCustomClockIn('09:00');
    setCustomClockOut('17:00');
  };

  const handleShiftChange = (shiftLabel: string) => {
    setSelectedShift(shiftLabel);
    const preset = SHIFT_PRESETS.find(p => p.label === shiftLabel);
    
    if (preset && preset.hours > 0) {
      // Set default times based on preset
      if (preset.hours === 4) {
        setCustomClockIn('09:00');
        setCustomClockOut('13:00');
      } else if (preset.hours === 8) {
        setCustomClockIn('09:00');
        setCustomClockOut('17:00');
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedEmployee || !selectedDate || !selectedShift) {
      toast({ 
        title: "Missing information", 
        description: "Please select employee, date, and shift type.",
        variant: "destructive" 
      });
      return;
    }

    if (selectedShift === 'Custom' && (!customClockIn || !customClockOut)) {
      toast({ 
        title: "Missing time information", 
        description: "Please set both clock in and clock out times.",
        variant: "destructive" 
      });
      return;
    }

    // Create datetime objects for clock in and out
    const clockInDateTime = new Date(`${selectedDate}T${customClockIn}:00`);
    const clockOutDateTime = new Date(`${selectedDate}T${customClockOut}:00`);

    if (clockInDateTime >= clockOutDateTime) {
      toast({ 
        title: "Invalid time range", 
        description: "Clock out time must be after clock in time.",
        variant: "destructive" 
      });
      return;
    }

    const entryData = {
      employee_id: selectedEmployee,
      entry_date: selectedDate,
      clock_in: clockInDateTime.toISOString(),
      clock_out: clockOutDateTime.toISOString(),
      is_paid: false,
      created_at: getManilaDateTime().toISOString(),
      updated_at: getManilaDateTime().toISOString()
    };

    createTimeEntry.mutate(entryData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Quick Clock In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Clock In Employee
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Shift Type</Label>
            <Select value={selectedShift} onValueChange={handleShiftChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Shift Type" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_PRESETS.map((preset) => (
                  <SelectItem key={preset.label} value={preset.label}>
                    <div className="flex flex-col">
                      <span>{preset.label}</span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedShift && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Clock In Time</Label>
                <Input
                  type="time"
                  value={customClockIn}
                  onChange={(e) => setCustomClockIn(e.target.value)}
                />
              </div>
              <div>
                <Label>Clock Out Time</Label>
                <Input
                  type="time"
                  value={customClockOut}
                  onChange={(e) => setCustomClockOut(e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedShift && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
              <strong>Summary:</strong> {selectedEmployee ? employees.find(e => e.id === selectedEmployee)?.name : 'Employee'} will be clocked in on {selectedDate} from {customClockIn} to {customClockOut}
              {(() => {
                const clockIn = new Date(`${selectedDate}T${customClockIn}:00`);
                const clockOut = new Date(`${selectedDate}T${customClockOut}:00`);
                const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
                return ` (${hours.toFixed(1)} hours)`;
              })()}
            </div>
          )}

          {selectedEmployee && employeeTasks.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tasks assigned for {selectedDate}:</Label>
              <div className="max-h-32 overflow-y-auto space-y-2 p-3 bg-muted rounded-md">
                {employeeTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 text-sm">
                    {task.is_completed ? (
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                        {task.task_description}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        Priority: {task.priority}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createTimeEntry.isPending || !selectedEmployee || !selectedDate || !selectedShift}
              className="bg-green-600 hover:bg-green-700"
            >
              {createTimeEntry.isPending ? 'Creating...' : 'Clock In Employee'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};