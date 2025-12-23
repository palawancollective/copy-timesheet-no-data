import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Clock, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  employee_id: string;
  amount: number;
  payment_date: string;
  note: string;
  created_at: string;
  updated_at: string;
  employees?: {
    name: string;
  };
}

interface PaymentsListProps {
  employeeId?: string;
  showEmployeeName?: boolean;
  isAdminMode?: boolean;
}

export const PaymentsList: React.FC<PaymentsListProps> = ({ 
  employeeId, 
  showEmployeeName = true,
  isAdminMode = false
}) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');

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
        .order('payment_date', { ascending: false });

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

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, amount, note }: { id: string; amount: number; note: string }) => {
      const { error } = await supabase
        .from('payments')
        .update({ amount, note, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setEditingId(null);
      toast({ title: "Payment updated successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error updating payment", 
        description: "Please try again.",
        variant: "destructive" 
      });
    }
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: "Payment deleted successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error deleting payment", 
        description: "Please try again.",
        variant: "destructive" 
      });
    }
  });

  const handleEdit = (payment: Payment) => {
    setEditingId(payment.id);
    setEditAmount(payment.amount.toString());
    setEditNote(payment.note);
  };

  const handleSave = () => {
    if (!editingId) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ 
        title: "Invalid amount", 
        description: "Please enter a valid amount.",
        variant: "destructive" 
      });
      return;
    }

    updatePaymentMutation.mutate({ 
      id: editingId, 
      amount, 
      note: editNote 
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditAmount('');
    setEditNote('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      deletePaymentMutation.mutate(id);
    }
  };

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
                  Paid: {formatDateTime(payment.payment_date)}
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
                  {isAdminMode && <TableHead>Actions</TableHead>}
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
                      {editingId === payment.id ? (
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-24"
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <Badge variant="default" className="text-xs">
                          ₱{payment.amount.toFixed(2)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="max-w-xs">
                      {editingId === payment.id ? (
                        <Textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="min-h-[60px]"
                          placeholder="Payment note..."
                        />
                      ) : (
                        <span className="truncate">{payment.note}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(payment.payment_date)}
                    </TableCell>
                    {isAdminMode && (
                      <TableCell>
                        {editingId === payment.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={handleSave}
                              disabled={updatePaymentMutation.isPending}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(payment)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(payment.id)}
                              disabled={deletePaymentMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
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