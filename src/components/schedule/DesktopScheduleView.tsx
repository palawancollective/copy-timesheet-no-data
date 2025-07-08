import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, Edit, Trash2, User } from 'lucide-react';
import { Employee, Schedule, WeekDay } from '@/types/schedule';
import { formatTime } from '@/lib/scheduleUtils';

interface DesktopScheduleViewProps {
  employees: Employee[];
  schedules: Schedule[];
  weekDates: WeekDay[];
  isAdminMode: boolean;
  onAddShift: (employeeId: string, date: string) => void;
  onEditShift: (employeeId: string, date: string, schedule?: Schedule) => void;
  onDeleteShift: (scheduleId: string) => void;
}

export const DesktopScheduleView: React.FC<DesktopScheduleViewProps> = ({
  employees,
  schedules,
  weekDates,
  isAdminMode,
  onAddShift,
  onEditShift,
  onDeleteShift
}) => {
  const getSchedulesForEmployeeAndDate = (employeeId: string, date: string) => {
    return schedules.filter(schedule => 
      schedule.employee_id === employeeId && schedule.schedule_date === date
    );
  };

  return (
    <Card className="animate-fade-in">
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
        <div className="w-full">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="p-3 font-semibold text-center bg-muted rounded">
              <User className="h-4 w-4 mx-auto mb-1" />
              Employee
            </div>
            {weekDates.map((day) => (
              <div key={day.date} className="p-3 text-center bg-muted rounded animate-fade-in">
                <div className="font-semibold text-sm">{day.dayName}</div>
                <div className="text-xs text-muted-foreground">{day.dayNumber}</div>
              </div>
            ))}
          </div>

          {/* Employee Rows */}
          {employees.map((employee) => (
            <div key={employee.id} className="grid grid-cols-8 gap-2 mb-3 animate-fade-in">
              <div className="p-3 bg-card border rounded flex items-center">
                <div className="font-medium">{employee.name}</div>
              </div>

              {weekDates.map((day) => {
                const daySchedules = getSchedulesForEmployeeAndDate(employee.id, day.date);
                
                return (
                  <div
                    key={`${employee.id}-${day.date}`}
                    className="min-h-[80px] p-2 bg-card border rounded relative hover:bg-accent/50 transition-all duration-200"
                  >
                    {daySchedules.length === 0 ? (
                      isAdminMode && (
                        <button
                          onClick={() => onAddShift(employee.id, day.date)}
                          className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <Plus className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      )
                    ) : (
                      <div className="space-y-1">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="bg-primary/10 border border-primary/20 rounded p-2 text-xs hover:bg-primary/20 transition-all duration-200 group animate-scale-in"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <Clock className="h-3 w-3 inline mr-1" />
                                <span className="font-medium text-xs">
                                  {formatTime(schedule.time_in)} - {formatTime(schedule.time_out)}
                                </span>
                              </div>
                              {isAdminMode && (
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover-scale"
                                    onClick={() => onEditShift(employee.id, day.date, schedule)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover-scale"
                                    onClick={() => onDeleteShift(schedule.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
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
  );
};