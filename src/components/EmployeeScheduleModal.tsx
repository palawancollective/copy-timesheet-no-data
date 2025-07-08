import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  schedule_date: string;
  time_in: string;
  time_out: string;
}

interface Employee {
  id: string;
  name: string;
}

interface EmployeeScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  schedules: ScheduleEntry[];
}

export const EmployeeScheduleModal: React.FC<EmployeeScheduleModalProps> = ({
  isOpen,
  onClose,
  employee,
  schedules
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay); // Start from Sunday
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {employee?.name}'s Weekly Schedule
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {weekDates.map((date, index) => {
            const schedule = schedules.find(s => s.schedule_date === date);
            const dayName = weekDays[index];
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <Card key={date} className={`${isToday ? 'border-blue-500 bg-blue-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className={`font-semibold ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                        {dayName}
                        {isToday && <span className="text-xs ml-2 bg-blue-500 text-white px-2 py-1 rounded">Today</span>}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(date)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      {schedule ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-mono">
                            {formatTime(schedule.time_in)} - {formatTime(schedule.time_out)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">No shift scheduled</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            📅 This is your schedule for the current week. Contact your supervisor if you have any questions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};