export interface Employee {
  id: string;
  name: string;
  hourly_rate: number;
}

export interface Schedule {
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

export interface ShiftModalData {
  employee_id: string;
  date: string;
  time_in: string;
  time_out: string;
  schedule_id?: string;
}

export interface TodayShift {
  id: string;
  employee_id: string;
  employee_name: string;
  schedule_date: string;
  time_in: string;
  time_out: string;
  weekSchedules: Schedule[];
}

export interface DaySchedule {
  date: string;
  dayName: string;
  fullDate: string;
  schedule?: Schedule;
}

export interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  fullDate: string;
}

export interface WeeklyScheduleProps {
  isAdminMode?: boolean;
}