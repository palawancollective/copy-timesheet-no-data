
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
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    
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
    if (!entry.clock_in) return 'Pending';
    if (entry.clock_out) return 'Completed';
    return 'Active';
  };

  // Mobile Card Component
  const MobileEntryCard = ({ entry }: { entry: TimeEntry }) => {
    const workHours = calculateWorkHours(entry);
    const status = getWorkStatus(entry);

    return (
      <div className="bg-card border rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{entry.employees.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.entry_date)}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            status === 'Completed' 
              ? 'bg-success/10 text-success' 
              : status === 'Active'
              ? 'bg-info/10 text-info'
              : 'bg-warning/10 text-warning'
          }`}>
            {status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs block mb-1">Clock In</span>
            <p className="font-medium">{formatTime(entry.clock_in)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block mb-1">Clock Out</span>
            <p className="font-medium">{formatTime(entry.clock_out)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block mb-1">Work Hours</span>
            <p className="font-semibold text-primary">{workHours.toFixed(2)} hrs</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block mb-1">Rate</span>
            <p className="font-medium">₱{entry.employees.hourly_rate}/hr</p>
          </div>
        </div>

        <div className="pt-3 border-t flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Payment</span>
          {entry.is_paid ? (
            <span className="text-success font-semibold text-sm">
              ₱{entry.paid_amount?.toFixed(2)}
            </span>
          ) : (
            <span className="text-warning font-medium text-sm">Unpaid</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl lg:text-2xl font-bold px-2 lg:px-0">All Time Entries</h2>
      
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No time entries found</p>
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="block lg:hidden space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto px-2">
            {entries.map((entry) => (
              <MobileEntryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-auto max-h-[600px] border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 bg-muted z-10">
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const workHours = calculateWorkHours(entry);
                  const status = getWorkStatus(entry);

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.employees.name}</TableCell>
                      <TableCell>{formatDate(entry.entry_date)}</TableCell>
                      <TableCell>{formatTime(entry.clock_in)}</TableCell>
                      <TableCell>{formatTime(entry.clock_out)}</TableCell>
                      <TableCell>{workHours.toFixed(2)} hrs</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'Completed' 
                            ? 'bg-success/10 text-success' 
                            : status === 'Active'
                            ? 'bg-info/10 text-info'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {status}
                        </span>
                      </TableCell>
                      <TableCell>₱{entry.employees.hourly_rate}/hr</TableCell>
                      <TableCell>
                        {entry.is_paid ? (
                          <span className="text-success font-medium">
                            Paid: ₱{entry.paid_amount?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unpaid</span>
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
