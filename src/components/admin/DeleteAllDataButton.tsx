import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export const DeleteAllDataButton: React.FC = () => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDeleteAllData = async () => {
    if (confirmText !== 'DELETE ALL') {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE ALL' to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Delete in order to respect foreign key constraints
      // First delete dependent tables
      const { error: paymentNotesError } = await supabase
        .from('payment_notes')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      if (paymentNotesError) throw paymentNotesError;

      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      if (paymentsError) throw paymentsError;

      const { error: tasksError } = await supabase
        .from('employee_tasks')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      if (tasksError) throw tasksError;

      const { error: timeEntriesError } = await supabase
        .from('time_entries')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      if (timeEntriesError) throw timeEntriesError;

      const { error: schedulesError } = await supabase
        .from('weekly_schedules')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      if (schedulesError) throw schedulesError;

      // Delete daily task templates (used by Daily Task Assignment)
      const { error: taskTemplatesError } = await supabase
        .from('task_templates')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      if (taskTemplatesError) throw taskTemplatesError;

      // Finally delete employees
      const { error: employeesError } = await supabase
        .from('employees')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');

      if (employeesError) throw employeesError;

      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['allTimeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['todaysEntries'] });
      queryClient.invalidateQueries({ queryKey: ['employee_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['weekly_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['payment_notes'] });

      // Task assignment + templates
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });

      toast({
        title: "All Data Deleted",
        description: "All employee data, time entries, tasks, schedules, and payments have been deleted.",
      });

      setIsOpen(false);
      setConfirmText('');
    } catch (error: any) {
      console.error('Error deleting data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete all data.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete All Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete All Data
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="font-semibold text-destructive">
                This action cannot be undone!
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>All employees</li>
                <li>All time entries</li>
                <li>All employee tasks</li>
                <li>All schedules</li>
                <li>All daily task templates</li>
                <li>All payment records</li>
                <li>All payment notes</li>
              </ul>
              <p className="pt-2 text-sm text-muted-foreground">
                Type <strong>DELETE ALL</strong> to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE ALL"
                className="mt-2"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText('')}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDeleteAllData}
            disabled={confirmText !== 'DELETE ALL' || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete All Data'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
