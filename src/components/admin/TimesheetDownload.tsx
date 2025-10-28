import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface TimesheetDownloadProps {
  timeEntries: any[];
  calculateWorkHoursForCSV: (entry: any) => number;
  employees: any[];
}

export const TimesheetDownload: React.FC<TimesheetDownloadProps> = ({ 
  timeEntries, 
  calculateWorkHoursForCSV,
  employees
}) => {
  const [csvStartDate, setCsvStartDate] = useState<Date>();
  const [csvEndDate, setCsvEndDate] = useState<Date>();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateCSVContent = (entries: any[]) => {
    return [
      ['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Rate', 'Pay', 'Paid Status', 'Paid Amount'].join(','),
      ...entries.map(entry => {
        const workHours = calculateWorkHoursForCSV(entry);
        const totalPay = workHours * entry.employees.hourly_rate;
        
        return [
          `"${entry.employees.name}"`,
          entry.entry_date,
          entry.clock_in ? `"${new Date(entry.clock_in).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}"` : '',
          entry.clock_out ? `"${new Date(entry.clock_out).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}"` : 'Still Working',
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

  // Proper CSV parser that handles quoted values with commas
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const employeeMap = new Map(employees.map(emp => [emp.name.toLowerCase(), emp]));
      const entriesToInsert = [];
      const errors = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const values = parseCSVLine(line);
        
        if (values.length < 9) {
          console.warn(`Row ${i + 2}: Expected 9 columns, got ${values.length}`);
          continue;
        }

        const [employeeName, date, clockIn, clockOut, hours, rate, pay, paidStatus, paidAmount] = values;
        
        console.log(`Row ${i + 2}:`, { employeeName, date, clockIn, clockOut, paidStatus });
        
        // Find employee
        const employee = employeeMap.get(employeeName.toLowerCase());
        if (!employee) {
          errors.push(`Row ${i + 2}: Employee "${employeeName}" not found`);
          continue;
        }

        // Parse timestamps - handle "M/D/YYYY, h:mm:ss AM/PM" format explicitly for Manila timezone
        const parseTime = (timeStr: string) => {
          if (!timeStr || timeStr === 'Still Working') return null;
          try {
            // Parse "10/12/2025, 9:00:00 AM" format explicitly as MM/DD/YYYY
            // Remove quotes if present
            const cleaned = timeStr.replace(/"/g, '').trim();
            
            // Use explicit date format parsing - this treats the input as Manila local time
            // When creating Date from a properly formatted string, it treats it as local time
            // Then we convert to ISO which gives us UTC
            const parsed = new Date(cleaned);
            
            if (isNaN(parsed.getTime())) {
              console.error(`Invalid date format: "${timeStr}"`);
              return null;
            }
            
            // The date is parsed as Manila local time, toISOString converts it to UTC
            return parsed.toISOString();
          } catch (error) {
            console.error(`Error parsing date "${timeStr}":`, error);
            return null;
          }
        };

        const entry = {
          employee_id: employee.id,
          entry_date: date,
          clock_in: parseTime(clockIn),
          clock_out: parseTime(clockOut),
          is_paid: paidStatus.trim().toLowerCase() === 'paid',
          paid_amount: paidAmount ? parseFloat(paidAmount) : null,
          paid_at: paidStatus.trim().toLowerCase() === 'paid' ? new Date().toISOString() : null
        };

        console.log('Parsed entry:', entry);
        entriesToInsert.push(entry);
      }

      if (errors.length > 0) {
        toast({
          title: 'Upload Warnings',
          description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''),
          variant: 'destructive'
        });
      }

      if (entriesToInsert.length === 0) {
        toast({
          title: 'No Data to Import',
          description: 'No valid entries found in the CSV file',
          variant: 'destructive'
        });
        return;
      }

      // Insert entries into database
      const { error } = await supabase
        .from('time_entries')
        .insert(entriesToInsert);

      if (error) throw error;

      toast({
        title: 'Upload Successful',
        description: `Successfully imported ${entriesToInsert.length} time entries`
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload time entries',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleBulkUpload}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Bulk Time In Sheet'}
        </Button>
      </div>
    </div>
  );
};