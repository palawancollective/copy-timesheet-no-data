
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { MainDisplay } from './MainDisplay';
import { AdminPanel } from './AdminPanel';
import { PasskeyModal } from './PasskeyModal';

export const TimeTrackingApp = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAdminAccess = (passkey: string) => {
    if (passkey === '4467') {
      setIsAdminMode(true);
      setShowPasskeyModal(false);
    } else {
      alert('Invalid passkey!');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Real-time Clock */}
      <header className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Time Tracker</h1>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-blue-600">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-600">
                {formatDate(currentTime)}
              </div>
            </div>

            <button
              onClick={() => setShowPasskeyModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isAdminMode ? (
          <AdminPanel onLogout={handleAdminLogout} />
        ) : (
          <MainDisplay />
        )}
      </main>

      {/* Passkey Modal */}
      {showPasskeyModal && (
        <PasskeyModal
          onSubmit={handleAdminAccess}
          onClose={() => setShowPasskeyModal(false)}
        />
      )}
    </div>
  );
};
