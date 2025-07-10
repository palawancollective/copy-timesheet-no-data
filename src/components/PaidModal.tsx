
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PaidModalProps {
  onClose: () => void;
}

export const PaidModal: React.FC<PaidModalProps> = ({ onClose }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  // Get Manila timezone date
  const getManilaDate = () => {
    const now = new Date();
    const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    return manilaTime.toISOString().split('T')[0];
  };

  const getManilaDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"})).toISOString();
  };

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ employeeId, amount, paidDate }: { employeeId: string; amount: number; paidDate: string }) => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) throw new Error('Employee not found');
      
      const customPaidAt = new Date(paidDate + 'T12:00:00').toISOString(); // Set to noon on selected date
      const now = getManilaDateTime();
      
      // Check if there's an entry for the paid date
      const { data: existingEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('entry_date', paidDate)
        .single();

      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('time_entries')
          .update({
            is_paid: true,
            paid_amount: amount,
            paid_at: customPaidAt,
            updated_at: now
          })
          .eq('id', existingEntry.id);
        
        if (error) throw error;
      } else {
        // Create new entry with payment
        const { error } = await supabase
          .from('time_entries')
          .insert({
            employee_id: employeeId,
            entry_date: paidDate,
            is_paid: true,
            paid_amount: amount,
            paid_at: customPaidAt
          });
        
        if (error) throw error;
      }
      
      return { employeeName: employee.name, amount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      toast({
        title: "Payment Recorded",
        description: `${data.employeeName} paid ₱${data.amount.toFixed(2)}`
      });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !paidAmount || !paidDate) return;
    
    recordPaymentMutation.mutate({
      employeeId: selectedEmployeeId,
      amount: parseFloat(paidAmount),
      paidDate: paidDate
    });
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Record Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee">Employee</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount Paid (₱)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="paid-date">Paid Date</Label>
            <Input
              id="paid-date"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              required
            />
          </div>

          {selectedEmployee && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                Payment for: <span className="font-semibold">{selectedEmployee.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Paid Date: <span className="font-semibold">{new Date(paidDate).toLocaleDateString('en-US')}</span>
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={recordPaymentMutation.isPending || !selectedEmployeeId || !paidAmount || !paidDate}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
