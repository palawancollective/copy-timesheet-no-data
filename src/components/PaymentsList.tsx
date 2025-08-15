import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock } from 'lucide-react';

interface Payment {
  id: string;
  employee_id: string;
  amount: number;
  payment_date: string;
  paid_at: string;
  note: string;
  created_at: string;
  employees?: {
    name: string;
  };
}

interface PaymentsListProps {
  employeeId?: string;
  showEmployeeName?: boolean;
}

export const PaymentsList: React.FC<PaymentsListProps> = ({ 
  employeeId, 
  showEmployeeName = true 
}) => {
  const queryClient = useQueryClient();

  // Fetch payments data
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', employeeId],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          employees (name)
        `)
        .order('paid_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Payment[];
    },
    refetchInterval: 2000 // Refresh every 2 seconds for real-time updates
  });

  // Set up real-time subscription for payments
  useEffect(() => {
    const channel = supabase
      .channel('payments-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['payments', employeeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, employeeId]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {employeeId ? 'My Payments' : 'All Employee Payments'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time payment records and transaction history
        </p>
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="block lg:hidden">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    {showEmployeeName && payment.employees && (
                      <h3 className="font-medium">{payment.employees.name}</h3>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.payment_date)}
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    ₱{payment.amount.toFixed(2)}
                  </Badge>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Note:</span>
                  <p className="text-muted-foreground mt-1">{payment.note}</p>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Paid: {formatDateTime(payment.paid_at)}
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
                  {showEmployeeName && <TableHead>Employee</TableHead>}
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Paid At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    {showEmployeeName && (
                      <TableCell className="font-medium">
                        {payment.employees?.name || 'Unknown'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="default" className="text-xs">
                        ₱{payment.amount.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {payment.note}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(payment.paid_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payments recorded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};