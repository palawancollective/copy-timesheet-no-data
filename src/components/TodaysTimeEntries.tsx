
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
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    
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
      <div className="bg-card border rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{entry.employees.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">₱{entry.employees.hourly_rate}/hr</p>
          </div>
          {!entry.is_paid && entry.clock_out && (
            <Button
              onClick={() => markAsPaidMutation.mutate(entry.id)}
              disabled={markAsPaidMutation.isPending}
              size="sm"
              className="bg-success hover:bg-success/90 shrink-0"
            >
              Mark Paid
            </Button>
          )}
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
            <span className="text-muted-foreground text-xs block mb-1">Total Pay</span>
            <p className="font-semibold text-success">₱{totalPay.toFixed(2)}</p>
          </div>
        </div>

        {entry.is_paid && (
          <div className="pt-3 border-t">
            <span className="text-success font-semibold text-sm">
              ✓ Paid: ₱{entry.paid_amount?.toFixed(2)}
            </span>
            <span className="text-muted-foreground text-xs block mt-1">
              {new Date(entry.paid_at!).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl lg:text-2xl font-bold px-2 lg:px-0">Today's Entries</h2>
      
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No entries for today</p>
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
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Total Pay</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const workHours = calculateWorkHours(entry);
                  const totalPay = calculatePay(entry);

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.employees.name}</TableCell>
                      <TableCell>₱{entry.employees.hourly_rate}/hr</TableCell>
                      <TableCell>{formatTime(entry.clock_in)}</TableCell>
                      <TableCell>{formatTime(entry.clock_out)}</TableCell>
                      <TableCell>{workHours.toFixed(2)} hrs</TableCell>
                      <TableCell className="font-semibold text-success">₱{totalPay.toFixed(2)}</TableCell>
                      <TableCell>
                        {entry.is_paid ? (
                          <span className="text-success">
                            Paid: ₱{entry.paid_amount?.toFixed(2)}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.paid_at!).toLocaleDateString()}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unpaid</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!entry.is_paid && entry.clock_out && (
                          <Button
                            onClick={() => markAsPaidMutation.mutate(entry.id)}
                            disabled={markAsPaidMutation.isPending}
                            size="sm"
                            className="bg-success hover:bg-success/90"
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
