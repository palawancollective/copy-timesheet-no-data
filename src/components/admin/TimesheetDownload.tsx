import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimesheetDownloadProps {
  timeEntries: any[];
  calculateWorkHoursForCSV: (entry: any) => number;
}

export const TimesheetDownload: React.FC<TimesheetDownloadProps> = ({ 
  timeEntries, 
  calculateWorkHoursForCSV 
}) => {
  const [csvStartDate, setCsvStartDate] = useState<Date>();
  const [csvEndDate, setCsvEndDate] = useState<Date>();

  const generateCSVContent = (entries: any[]) => {
    return [
      ['Employee', 'Date', 'Clock In', 'Clock Out', 'Lunch Out', 'Lunch In', 'Hours', 'Rate', 'Pay', 'Paid Status', 'Paid Amount'].join(','),
      ...entries.map(entry => {
        const workHours = calculateWorkHoursForCSV(entry);
        const totalPay = workHours * entry.employees.hourly_rate;
        
        return [
          `"${entry.employees.name}"`,
          entry.entry_date,
          entry.clock_in ? `"${new Date(entry.clock_in).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}"` : '',
          entry.clock_out ? `"${new Date(entry.clock_out).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}"` : 'Still Working',
          entry.lunch_out ? `"${new Date(entry.lunch_out).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}"` : '',
          entry.lunch_in ? `"${new Date(entry.lunch_in).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}"` : '',
          workHours.toFixed(2),
          entry.employees.hourly_rate.toFixed(2),
          totalPay.toFixed(2),
          entry.is_paid ? 'Paid' : 'Unpaid',
          entry.paid_amount ? entry.paid_amount.toFixed(2) : '0.00'
        ].join(',');
      })
    ].join('\n');
  };

  const downloadTimesheet = () => {
    // Filter entries by selected date range for CSV
    let filteredEntries = timeEntries;
    
    if (csvStartDate) {
      const startDateStr = format(csvStartDate, 'yyyy-MM-dd');
      const endDateStr = csvEndDate ? format(csvEndDate, 'yyyy-MM-dd') : startDateStr;
      
      filteredEntries = timeEntries.filter(entry => {
        const entryDate = entry.entry_date;
        return entryDate >= startDateStr && entryDate <= endDateStr;
      });
    }

    const csvContent = generateCSVContent(filteredEntries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateRange = csvStartDate 
      ? csvEndDate 
        ? `${format(csvStartDate, 'yyyy-MM-dd')}-to-${format(csvEndDate, 'yyyy-MM-dd')}`
        : format(csvStartDate, 'yyyy-MM-dd')
      : new Date().toISOString().split('T')[0];
    a.download = `timesheet-${dateRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadBulkTimesheet = () => {
    const csvContent = generateCSVContent(timeEntries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-time-in-sheet-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* CSV Date Selection */}
      <div className="flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !csvStartDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {csvStartDate ? format(csvStartDate, "MMM dd") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={csvStartDate}
              onSelect={setCsvStartDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !csvEndDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {csvEndDate ? format(csvEndDate, "MMM dd") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={csvEndDate}
              onSelect={setCsvEndDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        {(csvStartDate || csvEndDate) && (
          <Button
            onClick={() => {
              setCsvStartDate(undefined);
              setCsvEndDate(undefined);
            }}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
        )}
      </div>
      
      <Button
        onClick={downloadTimesheet}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Download className="h-4 w-4 mr-2" />
        Download CSV
      </Button>
      
      <Button
        onClick={downloadBulkTimesheet}
        className="bg-green-600 hover:bg-green-700"
      >
        <Download className="h-4 w-4 mr-2" />
        Bulk Time In Sheet
      </Button>
    </div>
  );
};