import React, { useState } from 'react';
import { MobileScheduleView } from './MobileScheduleView';
import { DesktopScheduleView } from './DesktopScheduleView';
import { EmployeeWeekModal } from './EmployeeWeekModal';
import { ShiftModal } from './ShiftModal';
import { useScheduleData } from '@/hooks/useScheduleData';
import { WeeklyScheduleProps, ShiftModalData, TodayShift, DaySchedule } from '@/types/schedule';
import { getWeekDates, BROKEN_SHIFT_PRESET } from '@/lib/scheduleUtils';
import { useIsMobile } from '@/hooks/use-mobile';

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ isAdminMode = false }) => {
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [customWeekStart, setCustomWeekStart] = useState<string>('');
  const [shiftModalData, setShiftModalData] = useState<ShiftModalData>({
    employee_id: '',
    date: '',
    time_in: '09:00',
    time_out: '17:00'
  });

  const isMobile = useIsMobile();
  const weekDates = getWeekDates(customWeekStart);
  
  const {
    employees,
    schedules,
    addScheduleMutation,
    updateScheduleMutation,
    deleteScheduleMutation
  } = useScheduleData(customWeekStart);

  // Get today's shifts for mobile list view
  const getTodayShifts = (): TodayShift[] => {
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = schedules.filter(schedule => schedule.schedule_date === today);
    
    return todaySchedules.map(schedule => {
      const employeeWeekSchedules = schedules.filter(s => s.employee_id === schedule.employee_id);
      return {
        id: schedule.id,
        employee_id: schedule.employee_id,
        employee_name: schedule.employees.name,
        schedule_date: schedule.schedule_date,
        time_in: schedule.time_in,
        time_out: schedule.time_out,
        weekSchedules: employeeWeekSchedules
      };
    });
  };

  const getEmployeeWeekSchedules = (employeeId: string): DaySchedule[] => {
    return weekDates.map(day => {
      const daySchedule = schedules.find(
        schedule => schedule.employee_id === employeeId && schedule.schedule_date === day.date
      );
      return {
        date: day.date,
        dayName: day.dayName,
        fullDate: day.fullDate,
        schedule: daySchedule
      };
    });
  };

  const openShiftModal = (employeeId: string, date: string, schedule?: any) => {
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
    setIsShiftModalOpen(false);
    setShiftModalData({
      employee_id: '',
      date: '',
      time_in: '09:00',
      time_out: '17:00'
    });
  };

  const handleSaveBrokenShift = (employeeId: string, date: string) => {
    // Create two schedule entries for broken shift
    BROKEN_SHIFT_PRESET.blocks.forEach((block) => {
      addScheduleMutation.mutate({
        employee_id: employeeId,
        schedule_date: date,
        time_in: block.time_in,
        time_out: block.time_out
      });
    });
    setIsShiftModalOpen(false);
    setShiftModalData({
      employee_id: '',
      date: '',
      time_in: '09:00',
      time_out: '17:00'
    });
  };

  const openEmployeeWeekModal = (employeeId: string) => {
    setSelectedEmployee(employeeId);
  };

  const handleDeleteShift = (scheduleId: string) => {
    deleteScheduleMutation.mutate(scheduleId);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {isMobile ? (
        <MobileScheduleView
          todayShifts={getTodayShifts()}
          isAdminMode={isAdminMode}
          onEmployeeClick={openEmployeeWeekModal}
          onAddShift={openShiftModal}
          onEditShift={openShiftModal}
          onDeleteShift={handleDeleteShift}
        />
      ) : (
        <DesktopScheduleView
          employees={employees}
          schedules={schedules}
          weekDates={weekDates}
          isAdminMode={isAdminMode}
          customWeekStart={customWeekStart}
          onWeekStartChange={setCustomWeekStart}
          onAddShift={openShiftModal}
          onEditShift={openShiftModal}
          onDeleteShift={handleDeleteShift}
        />
      )}

      <EmployeeWeekModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        selectedEmployee={selectedEmployee}
        employees={employees}
        weekSchedules={selectedEmployee ? getEmployeeWeekSchedules(selectedEmployee) : []}
        isAdminMode={isAdminMode}
        onEditShift={openShiftModal}
        onDeleteShift={handleDeleteShift}
      />

      {isAdminMode && (
        <ShiftModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          shiftData={shiftModalData}
          onShiftDataChange={setShiftModalData}
          employees={employees}
          onSave={handleSaveShift}
          onSaveBrokenShift={handleSaveBrokenShift}
          isLoading={addScheduleMutation.isPending || updateScheduleMutation.isPending}
        />
      )}
    </div>
  );
};