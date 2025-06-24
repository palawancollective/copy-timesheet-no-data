
import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface AllTimeEntriesProps {
  entries: TimeEntry[];
}

export const AllTimeEntries: React.FC<AllTimeEntriesProps> = ({ entries }) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('time-entries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries'
        },
        () => {
          // Invalidate queries to refresh data in real-time
          queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const calculateWorkHours = (entry: TimeEntry): number => {
    if (!entry.clock_in) return 0;
    
    const clockIn = new Date(entry.clock_in);
    const clockOut = entry.clock_out ? new Date(entry.clock_out) : new Date();
    let totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    
    // Subtract lunch break if both lunch times are recorded
    if (entry.lunch_out && entry.lunch_in) {
      const lunchOut = new Date(entry.lunch_out);
      const lunchIn = new Date(entry.lunch_in);
      const lunchMinutes = (lunchIn.getTime() - lunchOut.getTime()) / (1000 * 60);
      totalMinutes -= lunchMinutes;
    } else if (entry.lunch_out && !entry.lunch_in) {
      // If lunch out but not back in, subtract ongoing lunch time
      const lunchOut = new Date(entry.lunch_out);
      const now = new Date();
      const ongoingLunchMinutes = (now.getTime() - lunchOut.getTime()) / (1000 * 60);
      totalMinutes -= ongoingLunchMinutes;
    }
    
    return Math.max(0, totalMinutes / 60);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila'
    });
  };

  const getWorkStatus = (entry: TimeEntry) => {
    if (!entry.clock_in) return 'Not started';
    if (entry.clock_out) return 'Finished';
    if (entry.lunch_out && !entry.lunch_in) return 'On lunch';
    return 'Working';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">All Time Entries (Real-time)</h2>
      
      {entries.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No time entries found</p>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-white">Employee</TableHead>
                <TableHead className="sticky top-0 bg-white">Date</TableHead>
                <TableHead className="sticky top-0 bg-white">Clock In</TableHead>
                <TableHead className="sticky top-0 bg-white">Lunch Out</TableHead>
                <TableHead className="sticky top-0 bg-white">Lunch In</TableHead>
                <TableHead className="sticky top-0 bg-white">Clock Out</TableHead>
                <TableHead className="sticky top-0 bg-white">Hours</TableHead>
                <TableHead className="sticky top-0 bg-white">Status</TableHead>
                <TableHead className="sticky top-0 bg-white">Work Status</TableHead>
                <TableHead className="sticky top-0 bg-white">Paid Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const workHours = calculateWorkHours(entry);
                const workStatus = getWorkStatus(entry);
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.employees.name}
                    </TableCell>
                    <TableCell>{formatDate(entry.entry_date)}</TableCell>
                    <TableCell>{formatTime(entry.clock_in)}</TableCell>
                    <TableCell>{formatTime(entry.lunch_out)}</TableCell>
                    <TableCell>{formatTime(entry.lunch_in)}</TableCell>
                    <TableCell>{formatTime(entry.clock_out)}</TableCell>
                    <TableCell className="font-mono">
                      <span className={workStatus === 'Working' || workStatus === 'On lunch' ? 'text-blue-600 font-semibold' : ''}>
                        {workHours.toFixed(2)}h
                      </span>
                    </TableCell>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        workStatus === 'Working' ? 'bg-blue-100 text-blue-800' :
                        workStatus === 'On lunch' ? 'bg-orange-100 text-orange-800' :
                        workStatus === 'Finished' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {workStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.paid_amount ? `₱${entry.paid_amount.toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
