import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BulkClockOutProps {
  activeEntries: any[];
}

export const BulkClockOut: React.FC<BulkClockOutProps> = ({ activeEntries }) => {
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Get Manila timezone helpers
  const getManilaDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"})).toISOString();
  };

  // Bulk clock out mutation
  const bulkClockOutMutation = useMutation({
    mutationFn: async (entryIds: string[]) => {
      const now = getManilaDateTime();
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: now,
          updated_at: now
        })
        .in('id', entryIds);
      
      if (error) throw error;
    },
    onSuccess: (_, entryIds) => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      queryClient.invalidateQueries({ queryKey: ['allActivities'] });
      setSelectedEmployees(new Set());
      toast({ title: `Successfully clocked out ${entryIds.length} employee(s)!` });
    }
  });

  // Helper functions for selection
  const handleSelectEmployee = (entryId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedEmployees);
    if (isSelected) {
      newSelected.add(entryId);
    } else {
      newSelected.delete(entryId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmployees(new Set(activeEntries.map(entry => entry.id)));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  const handleBulkClockOut = () => {
    if (selectedEmployees.size === 0) return;
    bulkClockOutMutation.mutate(Array.from(selectedEmployees));
  };

  if (activeEntries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <LogOut className="h-5 w-5 mr-2" />
            Bulk Clock Out ({activeEntries.length} employees currently working)
          </span>
          <Button
            onClick={handleBulkClockOut}
            disabled={selectedEmployees.size === 0 || bulkClockOutMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Clock Out Selected ({selectedEmployees.size})
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="select-all"
              checked={selectedEmployees.size === activeEntries.length && activeEntries.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="font-medium">
              Select All Employees
            </Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`employee-${entry.id}`}
                  checked={selectedEmployees.has(entry.id)}
                  onCheckedChange={(checked) => handleSelectEmployee(entry.id, checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor={`employee-${entry.id}`} className="font-medium">
                    {entry.employees.name}
                  </Label>
                  <p className="text-sm text-gray-600">
                    Clocked in: {new Date(entry.clock_in!).toLocaleString('en-US', {
                      timeZone: 'Asia/Manila',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};