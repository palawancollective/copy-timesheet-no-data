import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calculator, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface HoursCalculatorProps {
  timeEntries: any[];
  calculateWorkHours: (entry: any) => number;
}

export const HoursCalculator: React.FC<HoursCalculatorProps> = ({ 
  timeEntries, 
  calculateWorkHours 
}) => {
  const [calculationDate, setCalculationDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [calculationResults, setCalculationResults] = useState<{
    totalHours: number;
    totalPay: number;
    employeeBreakdown: Array<{
      name: string;
      hours: number;
      pay: number;
    }>;
  } | null>(null);

  const calculateTotalHoursAndPay = () => {
    if (!calculationDate) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive",
      });
      return;
    }

    const startDateStr = format(calculationDate, 'yyyy-MM-dd');
    const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : startDateStr;

    // Filter entries by date range
    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = entry.entry_date;
      return entryDate >= startDateStr && entryDate <= endDateStr;
    });

    // Calculate totals
    let totalHours = 0;
    let totalPay = 0;
    const employeeBreakdown: Array<{ name: string; hours: number; pay: number; }> = [];

    // Group by employee
    const employeeMap = new Map<string, { name: string; hours: number; pay: number; }>();

    filteredEntries.forEach(entry => {
      const workHours = calculateWorkHours(entry);
      const employeePay = workHours * entry.employees.hourly_rate;
      
      totalHours += workHours;
      totalPay += employeePay;

      const existing = employeeMap.get(entry.employee_id);
      if (existing) {
        existing.hours += workHours;
        existing.pay += employeePay;
      } else {
        employeeMap.set(entry.employee_id, {
          name: entry.employees.name,
          hours: workHours,
          pay: employeePay
        });
      }
    });

    employeeBreakdown.push(...Array.from(employeeMap.values()));

    setCalculationResults({
      totalHours,
      totalPay,
      employeeBreakdown
    });

    toast({
      title: "Calculation Complete",
      description: `Total: ${totalHours.toFixed(2)} hours, ₱${totalPay.toFixed(2)}`,
    });
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Calculate Hours & Pay</h3>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex flex-col">
          <Label htmlFor="start-date" className="mb-2">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !calculationDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {calculationDate ? format(calculationDate, "PPP") : "Pick start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={calculationDate}
                onSelect={setCalculationDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex flex-col">
          <Label htmlFor="end-date" className="mb-2">End Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button
          onClick={calculateTotalHoursAndPay}
          className="bg-green-600 hover:bg-green-700"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calculate
        </Button>
        
        {endDate && (
          <Button
            onClick={() => setEndDate(undefined)}
            variant="outline"
            size="sm"
          >
            Clear End Date
          </Button>
        )}
      </div>
      
      {calculationResults && (
        <div className="mt-4 p-4 bg-white border rounded-lg">
          <h4 className="font-semibold text-lg mb-3">Calculation Results</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Total Hours:</span>
                <span className="text-blue-600 font-semibold">{calculationResults.totalHours.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Pay:</span>
                <span className="text-green-600 font-semibold">₱{calculationResults.totalPay.toFixed(2)}</span>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Employee Breakdown:</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {calculationResults.employeeBreakdown.map((emp, index) => (
                  <div key={index} className="text-sm flex justify-between">
                    <span>{emp.name}:</span>
                    <span>{emp.hours.toFixed(2)}h - ₱{emp.pay.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};