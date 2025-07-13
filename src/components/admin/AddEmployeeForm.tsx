import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AddEmployeeForm: React.FC = () => {
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRate, setNewEmployeeRate] = useState('');
  const queryClient = useQueryClient();

  // Add employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async ({ name, rate }: { name: string; rate: number }) => {
      const { error } = await supabase
        .from('employees')
        .insert({ name, hourly_rate: rate });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setNewEmployeeName('');
      setNewEmployeeRate('');
      toast({ title: "Employee added successfully!" });
    }
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim() || !newEmployeeRate.trim()) return;
    
    addEmployeeMutation.mutate({
      name: newEmployeeName.trim(),
      rate: parseFloat(newEmployeeRate)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add New Employee
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddEmployee} className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="employeeName">Employee Name</Label>
            <Input
              id="employeeName"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="Enter employee name"
              required
            />
          </div>
          <div className="w-32">
            <Label htmlFor="hourlyRate">Hourly Rate (₱)</Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              value={newEmployeeRate}
              onChange={(e) => setNewEmployeeRate(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={addEmployeeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Add Employee
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};