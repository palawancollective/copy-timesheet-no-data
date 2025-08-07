
import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getWorkStatusBadgeVariant, getPaidStatusBadgeVariant, getWorkHoursTextColor } from '@/lib/statusUtils';

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

  // Mobile Card Component
  const MobileEntryCard = ({ entry }: { entry: TimeEntry }) => {
    const workHours = calculateWorkHours(entry);
    const workStatus = getWorkStatus(entry);
    
    return (
      <div className="bg-card rounded-lg p-4 mb-4 border">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-card-foreground">{entry.employees.name}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(entry.entry_date)}</p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-mono font-semibold ${getWorkHoursTextColor(workStatus)}`}>
              {workHours.toFixed(2)}h
            </div>
            <Badge variant={getWorkStatusBadgeVariant(workStatus)}>
              {workStatus}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Clock In:</span>
            <div className="font-medium text-foreground">{formatTime(entry.clock_in)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Clock Out:</span>
            <div className="font-medium text-foreground">{formatTime(entry.clock_out)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Lunch Out:</span>
            <div className="font-medium text-foreground">{formatTime(entry.lunch_out)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Lunch In:</span>
            <div className="font-medium text-foreground">{formatTime(entry.lunch_in)}</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3 pt-3 border-t">
          <Badge variant={getPaidStatusBadgeVariant(entry.is_paid)}>
            {entry.is_paid ? 'Paid' : 'Unpaid'}
          </Badge>
          <div className="text-sm font-medium text-foreground">
            {entry.paid_amount ? `₱${entry.paid_amount.toFixed(2)}` : '-'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-4 md:p-6 w-full">
      <h2 className="text-lg md:text-xl font-bold text-card-foreground mb-4">All Time Entries (Real-time)</h2>
      
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No time entries found</p>
      ) : (
        <>
          {/* Mobile View */}
          <div className="block md:hidden">
            <div className="max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <MobileEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-card">Employee</TableHead>
                    <TableHead className="sticky top-0 bg-card">Date</TableHead>
                    <TableHead className="sticky top-0 bg-card">Clock In</TableHead>
                    <TableHead className="sticky top-0 bg-card">Lunch Out</TableHead>
                    <TableHead className="sticky top-0 bg-card">Lunch In</TableHead>
                    <TableHead className="sticky top-0 bg-card">Clock Out</TableHead>
                    <TableHead className="sticky top-0 bg-card">Hours</TableHead>
                    <TableHead className="sticky top-0 bg-card">Status</TableHead>
                    <TableHead className="sticky top-0 bg-card">Work Status</TableHead>
                    <TableHead className="sticky top-0 bg-card">Paid Amount</TableHead>
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
                          <span className={getWorkHoursTextColor(workStatus)}>
                            {workHours.toFixed(2)}h
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaidStatusBadgeVariant(entry.is_paid)}>
                            {entry.is_paid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getWorkStatusBadgeVariant(workStatus)}>
                            {workStatus}
                          </Badge>
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
          </div>
        </>
      )}
    </div>
  );
};
