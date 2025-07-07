
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

interface TimeEntry {
  id: string;
  employee_id: string;
  entry_date: string;
  clock_in: string | null;
  clock_out: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  is_paid: boolean | null;
  paid_amount: number | null;
  paid_at: string | null;
  employees: {
    name: string;
    hourly_rate: number;
  };
}

interface TodaysTimeEntriesProps {
  entries: TimeEntry[];
}

export const TodaysTimeEntries: React.FC<TodaysTimeEntriesProps> = ({ entries }) => {
  const queryClient = useQueryClient();

  const calculateWorkHours = (entry: TimeEntry): number => {
    if (!entry.clock_in || !entry.clock_out) return 0;
    
    const clockIn = new Date(entry.clock_in);
    const clockOut = new Date(entry.clock_out);
    let totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    
    // Subtract lunch break if both lunch times are recorded
    if (entry.lunch_out && entry.lunch_in) {
      const lunchOut = new Date(entry.lunch_out);
      const lunchIn = new Date(entry.lunch_in);
      const lunchMinutes = (lunchIn.getTime() - lunchOut.getTime()) / (1000 * 60);
      totalMinutes -= lunchMinutes;
    }
    
    return Math.max(0, totalMinutes / 60);
  };

  const calculatePay = (entry: TimeEntry): number => {
    const hours = calculateWorkHours(entry);
    return hours * entry.employees.hourly_rate;
  };

  const markAsPaidMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) throw new Error('Entry not found');
      
      const paidAmount = calculatePay(entry);
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('time_entries')
        .update({
          is_paid: true,
          paid_amount: paidAmount,
          paid_at: now,
          updated_at: now
        })
        .eq('id', entryId);
      
      if (error) throw error;
      
      return { employeeName: entry.employees.name, amount: paidAmount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      toast({
        title: "Payment Recorded",
        description: `${data.employeeName} paid ₱${data.amount.toFixed(2)}`
      });
    }
  });

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Mobile Card Component
  const MobileEntryCard = ({ entry }: { entry: TimeEntry }) => {
    const workHours = calculateWorkHours(entry);
    const totalPay = calculatePay(entry);
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-3 border">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{entry.employees.name}</h3>
            <p className="text-xs text-gray-600">Today's Entry</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-mono font-semibold text-gray-800">
              {workHours.toFixed(2)}h
            </div>
            <div className="text-sm font-medium">₱{totalPay.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <span className="text-gray-500">Clock In:</span>
            <div className="font-medium">{formatTime(entry.clock_in)}</div>
          </div>
          <div>
            <span className="text-gray-500">Clock Out:</span>
            <div className="font-medium">{formatTime(entry.clock_out)}</div>
          </div>
          <div>
            <span className="text-gray-500">Lunch Out:</span>
            <div className="font-medium">{formatTime(entry.lunch_out)}</div>
          </div>
          <div>
            <span className="text-gray-500">Lunch In:</span>
            <div className="font-medium">{formatTime(entry.lunch_in)}</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            entry.is_paid 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {entry.is_paid ? 'Paid' : 'Unpaid'}
          </span>
          {!entry.is_paid && entry.clock_out && (
            <Button
              onClick={() => markAsPaidMutation.mutate(entry.id)}
              disabled={markAsPaidMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs h-auto"
            >
              Mark Paid
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Today's Time Entries</h2>
      
      {entries.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No time entries for today</p>
      ) : (
        <>
          {/* Mobile View */}
          <div className="block md:hidden">
            <div className="max-h-80 overflow-y-auto">
              {entries.map((entry) => (
                <MobileEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Lunch Out</TableHead>
                  <TableHead>Lunch In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const workHours = calculateWorkHours(entry);
                  const totalPay = calculatePay(entry);
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.employees.name}
                      </TableCell>
                      <TableCell>{formatTime(entry.clock_in)}</TableCell>
                      <TableCell>{formatTime(entry.lunch_out)}</TableCell>
                      <TableCell>{formatTime(entry.lunch_in)}</TableCell>
                      <TableCell>{formatTime(entry.clock_out)}</TableCell>
                      <TableCell>{workHours.toFixed(2)}h</TableCell>
                      <TableCell>₱{totalPay.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          entry.is_paid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {!entry.is_paid && entry.clock_out && (
                          <Button
                            onClick={() => markAsPaidMutation.mutate(entry.id)}
                            disabled={markAsPaidMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
