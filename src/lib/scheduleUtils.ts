import { WeekDay } from '@/types/schedule';

// Common shift presets
export const SHIFT_PRESETS = [
  { label: 'Morning Shift', time_in: '07:00', time_out: '16:00' },
  { label: 'Evening Shift', time_in: '12:00', time_out: '21:00' },
  { label: 'Maintenance Shift', time_in: '08:00', time_out: '17:00' },
];

// Broken shift preset (two time blocks)
export const BROKEN_SHIFT_PRESET = {
  label: 'Broken Shift',
  blocks: [
    { time_in: '07:00', time_out: '11:00' },
    { time_in: '17:00', time_out: '21:00' }
  ]
};

// Get current week's Sunday
export const getCurrentWeekStart = (): string => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day;
  const sunday = new Date(today.setDate(diff));
  return sunday.toISOString().split('T')[0];
};

// Get week start date from any given date (finds Sunday of that week)
export const getWeekStartFromDate = (date: string): string => {
  const selectedDate = new Date(date);
  const day = selectedDate.getDay();
  const diff = selectedDate.getDate() - day;
  const sunday = new Date(selectedDate.setDate(diff));
  return sunday.toISOString().split('T')[0];
};

// Get week dates (Sunday to Saturday) from a specific start date
export const getWeekDates = (customStartDate?: string): WeekDay[] => {
  const weekStart = customStartDate ? getWeekStartFromDate(customStartDate) : getCurrentWeekStart();
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

export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};