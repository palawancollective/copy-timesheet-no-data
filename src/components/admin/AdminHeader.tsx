import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface AdminHeaderProps {
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout }) => {
  return (
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
  );
};