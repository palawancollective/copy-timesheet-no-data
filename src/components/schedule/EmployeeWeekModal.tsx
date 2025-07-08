import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Edit, Trash2, Plus, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { DaySchedule, Employee } from '@/types/schedule';
import { formatTime } from '@/lib/scheduleUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmployeeWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployee: string | null;
  employees: Employee[];
  weekSchedules: DaySchedule[];
  isAdminMode: boolean;
  onEditShift: (employeeId: string, date: string, schedule?: any) => void;
  onDeleteShift: (scheduleId: string) => void;
}

export const EmployeeWeekModal: React.FC<EmployeeWeekModalProps> = ({
  isOpen,
  onClose,
  selectedEmployee,
  employees,
  weekSchedules,
  isAdminMode,
  onEditShift,
  onDeleteShift
}) => {
  const isMobile = useIsMobile();
  const selectedEmployeeName = employees.find(emp => emp.id === selectedEmployee)?.name || '';

  const ModalContent = () => (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
      {weekSchedules.map((day) => (
        <div key={day.date} className="flex items-center justify-between p-3 bg-card border rounded-lg animate-fade-in">
          <div>
            <div className="font-medium">{day.dayName} {day.fullDate}</div>
            {day.schedule ? (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatTime(day.schedule.time_in)} – {formatTime(day.schedule.time_out)}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Off</div>
            )}
          </div>
          {isAdminMode && (
            <div className="flex items-center space-x-2">
              {day.schedule ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditShift(selectedEmployee!, day.date, day.schedule)}
                    className="hover-scale"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteShift(day.schedule!.id)}
                    className="text-destructive hover:text-destructive hover-scale"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditShift(selectedEmployee!, day.date)}
                  className="hover-scale"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              {selectedEmployeeName} — Weekly Schedule
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <ModalContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            {selectedEmployeeName} — Weekly Schedule
          </DialogTitle>
        </DialogHeader>
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
};