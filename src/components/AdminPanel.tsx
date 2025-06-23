
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, LogOut, Plus, Edit, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRate, setNewEmployeeRate] = useState('');
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const queryClient = useQueryClient();

  // Get Manila timezone helpers
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

  // Fetch all time entries
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['allTimeEntries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          employees (name, hourly_rate)
        `)
        .order('entry_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

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

  // Update time entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('time_entries')
        .update({ ...updates, updated_at: getManilaDateTime() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      setEditingEntry(null);
      setEditForm({});
      toast({ title: "Time entry updated successfully!" });
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

  const startEditing = (entry: any) => {
    setEditingEntry(entry.id);
    setEditForm({
      clock_in: entry.clock_in ? new Date(entry.clock_in).toISOString().slice(0, 16) : '',
      clock_out: entry.clock_out ? new Date(entry.clock_out).toISOString().slice(0, 16) : '',
      lunch_out: entry.lunch_out ? new Date(entry.lunch_out).toISOString().slice(0, 16) : '',
      lunch_in: entry.lunch_in ? new Date(entry.lunch_in).toISOString().slice(0, 16) : '',
      paid_amount: entry.paid_amount || '',
      is_paid: entry.is_paid || false
    });
  };

  const saveEdit = () => {
    const updates: any = {};
    
    if (editForm.clock_in) updates.clock_in = new Date(editForm.clock_in).toISOString();
    if (editForm.clock_out) updates.clock_out = new Date(editForm.clock_out).toISOString();
    if (editForm.lunch_out) updates.lunch_out = new Date(editForm.lunch_out).toISOString();
    if (editForm.lunch_in) updates.lunch_in = new Date(editForm.lunch_in).toISOString();
    if (editForm.paid_amount) updates.paid_amount = parseFloat(editForm.paid_amount);
    updates.is_paid = editForm.is_paid;

    updateEntryMutation.mutate({
      id: editingEntry!,
      updates
    });
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const downloadTimesheet = () => {
    const csvContent = [
      ['Employee', 'Date', 'Clock In', 'Clock Out', 'Lunch Out', 'Lunch In', 'Hours', 'Rate', 'Pay', 'Paid Status', 'Paid Amount'].join(','),
      ...timeEntries.map(entry => {
        const workHours = calculateWorkHours(entry);
        const totalPay = workHours * entry.employees.hourly_rate;
        
        return [
          entry.employees.name,
          entry.entry_date,
          entry.clock_in ? new Date(entry.clock_in).toLocaleString() : '',
          entry.clock_out ? new Date(entry.clock_out).toLocaleString() : '',
          entry.lunch_out ? new Date(entry.lunch_out).toLocaleString() : '',
          entry.lunch_in ? new Date(entry.lunch_in).toLocaleString() : '',
          workHours.toFixed(2),
          entry.employees.hourly_rate.toFixed(2),
          totalPay.toFixed(2),
          entry.is_paid ? 'Paid' : 'Unpaid',
          entry.paid_amount ? entry.paid_amount.toFixed(2) : '0.00'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateWorkHours = (entry: any): number => {
    if (!entry.clock_in || !entry.clock_out) return 0;
    
    const clockIn = new Date(entry.clock_in);
    const clockOut = new Date(entry.clock_out);
    let totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
    
    if (entry.lunch_out && entry.lunch_in) {
      const lunchOut = new Date(entry.lunch_out);
      const lunchIn = new Date(entry.lunch_in);
      const lunchMinutes = (lunchIn.getTime() - lunchOut.getTime()) / (1000 * 60);
      totalMinutes -= lunchMinutes;
    }
    
    return Math.max(0, totalMinutes / 60);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatDateTimeForInput = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
        <Button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Add Employee */}
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

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {employees.map((employee) => (
              <div key={employee.id} className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-lg">{employee.name}</h3>
                <p className="text-gray-600">₱{employee.hourly_rate}/hour</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Download Timesheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Timesheet Management
            <Button
              onClick={downloadTimesheet}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Lunch Out</TableHead>
                  <TableHead>Lunch In</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.slice(0, 20).map((entry) => {
                  const workHours = calculateWorkHours(entry);
                  const isEditing = editingEntry === entry.id;
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.employees.name}
                      </TableCell>
                      <TableCell>{entry.entry_date}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="datetime-local"
                            value={editForm.clock_in}
                            onChange={(e) => setEditForm({...editForm, clock_in: e.target.value})}
                            className="w-40"
                          />
                        ) : (
                          formatDateTime(entry.clock_in)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="datetime-local"
                            value={editForm.clock_out}
                            onChange={(e) => setEditForm({...editForm, clock_out: e.target.value})}
                            className="w-40"
                          />
                        ) : (
                          formatDateTime(entry.clock_out)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="datetime-local"
                            value={editForm.lunch_out}
                            onChange={(e) => setEditForm({...editForm, lunch_out: e.target.value})}
                            className="w-40"
                          />
                        ) : (
                          formatDateTime(entry.lunch_out)
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="datetime-local"
                            value={editForm.lunch_in}
                            onChange={(e) => setEditForm({...editForm, lunch_in: e.target.value})}
                            className="w-40"
                          />
                        ) : (
                          formatDateTime(entry.lunch_in)
                        )}
                      </TableCell>
                      <TableCell>{workHours.toFixed(2)}h</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <select
                            value={editForm.is_paid ? 'true' : 'false'}
                            onChange={(e) => setEditForm({...editForm, is_paid: e.target.value === 'true'})}
                            className="border rounded px-2 py-1"
                          >
                            <option value="false">Unpaid</option>
                            <option value="true">Paid</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            entry.is_paid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.is_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editForm.paid_amount}
                            onChange={(e) => setEditForm({...editForm, paid_amount: e.target.value})}
                            placeholder="0.00"
                            className="w-24"
                          />
                        ) : (
                          entry.paid_amount ? `₱${entry.paid_amount.toFixed(2)}` : '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <Button
                              onClick={saveEdit}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              size="sm"
                              variant="outline"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => startEditing(entry)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
