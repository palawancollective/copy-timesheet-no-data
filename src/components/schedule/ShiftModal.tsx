import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Employee, ShiftModalData } from '@/types/schedule';
import { SHIFT_PRESETS } from '@/lib/scheduleUtils';
import { useToast } from '@/hooks/use-toast';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: ShiftModalData;
  onShiftDataChange: (data: ShiftModalData) => void;
  employees: Employee[];
  onSave: () => void;
  isLoading: boolean;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  shiftData,
  onShiftDataChange,
  employees,
  onSave,
  isLoading
}) => {
  const { toast } = useToast();

  const handleSave = () => {
    if (!shiftData.employee_id || !shiftData.date || !shiftData.time_in || !shiftData.time_out) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (shiftData.time_in >= shiftData.time_out) {
      toast({ title: "Time out must be after time in", variant: "destructive" });
      return;
    }

    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {shiftData.schedule_id ? 'Edit Shift' : 'Add New Shift'}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Set employee, date, time in and time out for the shift.</DialogDescription>
        <div className="space-y-4">
          <div>
            <Label>Employee</Label>
            <Select
              value={shiftData.employee_id}
              onValueChange={(value) => onShiftDataChange({ ...shiftData, employee_id: value })}
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
              value={shiftData.date}
              onChange={(e) => onShiftDataChange({ ...shiftData, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Time In</Label>
              <Input
                type="time"
                value={shiftData.time_in}
                onChange={(e) => onShiftDataChange({ ...shiftData, time_in: e.target.value })}
              />
            </div>
            <div>
              <Label>Time Out</Label>
              <Input
                type="time"
                value={shiftData.time_out}
                onChange={(e) => onShiftDataChange({ ...shiftData, time_out: e.target.value })}
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
                  onClick={() => onShiftDataChange({
                    ...shiftData,
                    time_in: preset.time_in,
                    time_out: preset.time_out
                  })}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {shiftData.schedule_id ? 'Update' : 'Add'} Shift
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};