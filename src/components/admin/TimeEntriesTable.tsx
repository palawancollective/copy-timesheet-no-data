import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Save, X, Trash2, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { QuickClockInModal } from './QuickClockInModal';

interface TimeEntriesTableProps {
  timeEntries: any[];
  calculateWorkHours: (entry: any) => number;
}

export const TimeEntriesTable: React.FC<TimeEntriesTableProps> = ({ 
  timeEntries, 
  calculateWorkHours 
}) => {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const queryClient = useQueryClient();

  // Get Manila timezone helpers
  const getManilaDateTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"})).toISOString();
  };

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
      queryClient.invalidateQueries({ queryKey: ['allActivities'] });
      setEditingEntry(null);
      setEditForm({});
      toast({ title: "Time entry updated successfully!" });
    },
    onError: (error) => {
      console.error('Error updating entry:', error);
      toast({ 
        title: "Error updating entry", 
        description: "Please check your changes and try again.",
        variant: "destructive"
      });
    }
  });

  // Delete time entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      queryClient.invalidateQueries({ queryKey: ['allActivities'] });
      toast({ title: "Time entry deleted successfully!" });
    }
  });

  // Clock out employee mutation
  const clockOutEmployeeMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const now = getManilaDateTime();
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: now,
          updated_at: now
        })
        .eq('id', entryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      queryClient.invalidateQueries({ queryKey: ['allActivities'] });
      toast({ title: "Employee clocked out successfully!" });
    }
  });

  const startEditing = (entry: any) => {
    setEditingEntry(entry.id);
    setEditForm({
      entry_date: entry.entry_date,
      clock_in: entry.clock_in ? new Date(entry.clock_in).toISOString().slice(0, 16) : '',
      clock_out: entry.clock_out ? new Date(entry.clock_out).toISOString().slice(0, 16) : '',
      lunch_out: entry.lunch_out ? new Date(entry.lunch_out).toISOString().slice(0, 16) : '',
      lunch_in: entry.lunch_in ? new Date(entry.lunch_in).toISOString().slice(0, 16) : '',
      paid_amount: entry.paid_amount || '',
      is_paid: entry.is_paid || false
    });
  };

  const handleSubmitEdit = () => {
    if (!editingEntry) return;

    const updates: any = {};
    
    // Update entry date
    if (editForm.entry_date) {
      updates.entry_date = editForm.entry_date;
    }
    
    // Convert datetime-local values to proper ISO timestamps
    if (editForm.clock_in) {
      updates.clock_in = new Date(editForm.clock_in).toISOString();
    } else {
      updates.clock_in = null;
    }
    
    if (editForm.clock_out) {
      updates.clock_out = new Date(editForm.clock_out).toISOString();
    } else {
      updates.clock_out = null;
    }
    
    if (editForm.lunch_out) {
      updates.lunch_out = new Date(editForm.lunch_out).toISOString();
    } else {
      updates.lunch_out = null;
    }
    
    if (editForm.lunch_in) {
      updates.lunch_in = new Date(editForm.lunch_in).toISOString();
    } else {
      updates.lunch_in = null;
    }
    
    if (editForm.paid_amount && !isNaN(parseFloat(editForm.paid_amount))) {
      updates.paid_amount = parseFloat(editForm.paid_amount);
    } else {
      updates.paid_amount = null;
    }
    
    updates.is_paid = editForm.is_paid;

    updateEntryMutation.mutate({
      id: editingEntry,
      updates
    });
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const handleDeleteEntry = (id: string) => {
    deleteEntryMutation.mutate(id);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Time Entries Management</h3>
        <QuickClockInModal />
      </div>
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
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editForm.entry_date}
                      onChange={(e) => setEditForm({...editForm, entry_date: e.target.value})}
                      className="w-36"
                    />
                  ) : (
                    entry.entry_date
                  )}
                </TableCell>
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
                        onClick={handleSubmitEdit}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={updateEntryMutation.isPending}
                      >
                        <Save className="h-3 w-3" />
                        {updateEntryMutation.isPending ? 'Saving...' : 'Submit'}
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
                    <div className="flex space-x-2">
                      {entry.clock_in && !entry.clock_out && (
                        <Button
                          onClick={() => clockOutEmployeeMutation.mutate(entry.id)}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          disabled={clockOutEmployeeMutation.isPending}
                        >
                          <LogOut className="h-3 w-3" />
                          Clock Out
                        </Button>
                      )}
                      <Button
                        onClick={() => startEditing(entry)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this time entry for {entry.employees.name} on {entry.entry_date}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};