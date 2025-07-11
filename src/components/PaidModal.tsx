
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
  const queryClient = useQueryClient();

  // Get Manila timezone date and time (real-time)
  const getManilaDate = () => {
    const now = new Date();
    const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    return manilaTime.toISOString().split('T')[0];
  };

  const getManilaDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"})).toISOString();
  };

  // Always use today's date for real-time payment recording
  const todayDate = getManilaDate();

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
    mutationFn: async ({ employeeId, amount }: { employeeId: string; amount: number }) => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) throw new Error('Employee not found');
      
      const now = getManilaDateTime();
      
      // Check if there's an entry for today
      const { data: existingEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('entry_date', todayDate)
        .single();

      if (existingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('time_entries')
          .update({
            is_paid: true,
            paid_amount: amount,
            paid_at: now,
            updated_at: now
          })
          .eq('id', existingEntry.id);
        
        if (error) throw error;
      } else {
        // Create new entry with payment for today
        const { error } = await supabase
          .from('time_entries')
          .insert({
            employee_id: employeeId,
            entry_date: todayDate,
            is_paid: true,
            paid_amount: amount,
            paid_at: now
          });
        
        if (error) throw error;
      }
      
      return { employeeName: employee.name, amount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['allActivities'] }); // Real-time activity table
      toast({
        title: "Payment Recorded ✅",
        description: `${data.employeeName} paid ₱${data.amount.toFixed(2)} - ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })}`
      });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !paidAmount) return;
    
    recordPaymentMutation.mutate({
      employeeId: selectedEmployeeId,
      amount: parseFloat(paidAmount)
    });
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Record Real-Time Payment</h2>
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

          {selectedEmployee && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">Real-Time Payment</span>
              </div>
              <p className="text-sm text-gray-700">
                Payment for: <span className="font-semibold">{selectedEmployee.name}</span>
              </p>
              <p className="text-sm text-gray-700">
                Date: <span className="font-semibold">{new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })}</span>
              </p>
              <p className="text-sm text-gray-700">
                Time: <span className="font-semibold">{new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
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
              disabled={recordPaymentMutation.isPending || !selectedEmployeeId || !paidAmount}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment Now'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
