import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { TodayShift } from '@/types/schedule';
import { formatTime } from '@/lib/scheduleUtils';

interface MobileScheduleViewProps {
  todayShifts: TodayShift[];
  isAdminMode: boolean;
  onEmployeeClick: (employeeId: string) => void;
  onAddShift: (employeeId: string, date: string) => void;
  onEditShift: (employeeId: string, date: string, schedule?: any) => void;
  onDeleteShift: (scheduleId: string) => void;
}

export const MobileScheduleView: React.FC<MobileScheduleViewProps> = ({
  todayShifts,
  isAdminMode,
  onEmployeeClick,
  onAddShift,
  onEditShift,
  onDeleteShift
}) => {
  const today = new Date();
  const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}`;
  const todayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today's Schedule
            </div>
            <span className="text-sm text-muted-foreground">{todayFormatted}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayShifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No shifts scheduled for today</p>
              {isAdminMode && (
                <Button
                  variant="outline"
                  className="mt-4 hover-scale"
                  onClick={() => onAddShift('', todayDate)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift
                </Button>
              )}
            </div>
          ) : (
            todayShifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-accent/50 transition-all duration-200 animate-fade-in hover-scale"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onEmployeeClick(shift.employee_id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{shift.employee_name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatTime(shift.time_in)} – {formatTime(shift.time_out)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
                {isAdminMode && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditShift(shift.employee_id, shift.schedule_date, { id: shift.id, time_in: shift.time_in, time_out: shift.time_out });
                      }}
                      className="hover-scale"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteShift(shift.id);
                      }}
                      className="text-destructive hover:text-destructive hover-scale"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};