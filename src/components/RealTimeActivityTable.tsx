import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, DollarSign, Users } from 'lucide-react';

interface ActivityEntry {
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
  created_at: string;
  updated_at: string;
  employees: {
    name: string;
    hourly_rate: number;
  };
  completed_tasks?: number;
}

export const RealTimeActivityTable: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch all time entries with employee data and task completion counts
  const { data: activities = [] } = useQuery({
    queryKey: ['allActivities'],
    queryFn: async () => {
      // Get time entries with employee data
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select(`
          *,
          employees (name, hourly_rate)
        `)
        .order('updated_at', { ascending: false })
        .order('entry_date', { ascending: false });
      
      if (timeError) throw timeError;

      // Get task completion counts for each entry
      const entriesWithTasks = await Promise.all(
        timeEntries.map(async (entry) => {
          const { data: tasks, error: taskError } = await supabase
            .from('employee_tasks')
            .select('id')
            .eq('employee_id', entry.employee_id)
            .eq('assigned_date', entry.entry_date)
            .eq('is_completed', true);
          
          if (taskError) {
            console.error('Error fetching tasks:', taskError);
          }

          return {
            ...entry,
            completed_tasks: tasks?.length || 0
          };
        })
      );

      return entriesWithTasks as ActivityEntry[];
    },
    refetchInterval: 2000 // Refresh every 2 seconds for real-time updates
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('activity-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['allActivities'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['allActivities'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (entry: ActivityEntry) => {
    if (entry.clock_out) {
      return <Badge variant="secondary">Completed</Badge>;
    } else if (entry.clock_in) {
      return <Badge variant="default">Active</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Real-Time Employee Activity Log
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Live updates of all employee clock-ins, breaks, tasks, and payments
        </p>
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="block lg:hidden">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{activity.employees.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(activity.entry_date)}</p>
                  </div>
                  {getStatusBadge(activity)}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Clock In:</span>
                    <p className="text-muted-foreground">{formatTime(activity.clock_in)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Clock Out:</span>
                    <p className="text-muted-foreground">{formatTime(activity.clock_out)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Lunch Out:</span>
                    <p className="text-muted-foreground">{formatTime(activity.lunch_out)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Lunch In:</span>
                    <p className="text-muted-foreground">{formatTime(activity.lunch_in)}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{activity.completed_tasks} tasks completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {activity.is_paid ? (
                      <Badge variant="default" className="text-xs">Paid</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Unpaid</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Lunch Out</TableHead>
                  <TableHead>Lunch In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      {activity.employees.name}
                    </TableCell>
                    <TableCell>{formatDate(activity.entry_date)}</TableCell>
                    <TableCell>{formatTime(activity.clock_in)}</TableCell>
                    <TableCell>{formatTime(activity.lunch_out)}</TableCell>
                    <TableCell>{formatTime(activity.lunch_in)}</TableCell>
                    <TableCell>{formatTime(activity.clock_out)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{activity.completed_tasks}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.is_paid ? (
                        <Badge variant="default" className="text-xs">
                          Paid ₱{activity.paid_amount?.toFixed(2) || '0.00'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Unpaid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(activity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};