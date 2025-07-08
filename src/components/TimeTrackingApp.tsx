
import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, FileText, Calendar } from 'lucide-react';
import { MainDisplay } from './MainDisplay';
import { AdminPanel } from './AdminPanel';
import { PasskeyModal } from './PasskeyModal';
import { PaidModal } from './PaidModal';
import { InvoiceGenerator } from './InvoiceGenerator';
import { WeeklySchedule } from './WeeklySchedule';

export const TimeTrackingApp = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showPaidPasskeyModal, setShowPaidPasskeyModal] = useState(false);
  const [showInvoiceMode, setShowInvoiceMode] = useState(false);
  const [showScheduleMode, setShowScheduleMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      // Get Manila time
      const now = new Date();
      const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
      setCurrentTime(manilaTime);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAdminAccess = (passkey: string) => {
    if (passkey === '4467') {
      setIsAdminMode(true);
      setShowInvoiceMode(false);
      setShowScheduleMode(false);
      setShowPasskeyModal(false);
    } else {
      alert('Invalid passkey!');
    }
  };

  const handlePaidAccess = (passkey: string) => {
    if (passkey === '4467') {
      setShowPaidPasskeyModal(false);
      setShowPaidModal(true);
    } else {
      alert('Invalid passkey!');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
  };

  const handlePaidButtonClick = () => {
    setShowPaidPasskeyModal(true);
  };

  const handleInvoiceButtonClick = () => {
    setShowInvoiceMode(true);
    setShowScheduleMode(false);
    setIsAdminMode(false);
  };

  const handleScheduleButtonClick = () => {
    setShowScheduleMode(true);
    setShowInvoiceMode(false);
    setIsAdminMode(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Manila'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Manila'
    });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b-4 border-blue-500">
        <div className="w-full px-4 py-3">
          {/* Mobile Layout */}
          <div className="flex flex-col space-y-3 md:hidden">
            {/* Top Row - Logo and Time */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Clock className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-bold text-gray-800">Time Tracker</h1>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-blue-600">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-gray-600">
                  {formatDate(currentTime)}
                </div>
              </div>
            </div>
            
            {/* Bottom Row - Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={handlePaidButtonClick}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center text-xs"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Paid
              </button>
              <button
                onClick={handleInvoiceButtonClick}
                className={`${showInvoiceMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'} text-white px-2 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center text-xs`}
              >
                <FileText className="h-3 w-3 mr-1" />
                Invoice
              </button>
              <button
                onClick={handleScheduleButtonClick}
                className={`${showScheduleMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'} text-white px-2 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center text-xs`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Schedule
              </button>
              <button
                onClick={() => setShowPasskeyModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-lg font-semibold transition-colors text-xs"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
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

            <div className="flex space-x-3">
              <button
                onClick={handlePaidButtonClick}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Paid
              </button>
              <button
                onClick={handleInvoiceButtonClick}
                className={`${showInvoiceMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'} text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Invoice
              </button>
              <button
                onClick={handleScheduleButtonClick}
                className={`${showScheduleMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'} text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </button>
              <button
                onClick={() => setShowPasskeyModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-4 md:py-8 overflow-x-hidden">
        <div className="max-w-full">
          {isAdminMode ? (
            <AdminPanel onLogout={handleAdminLogout} />
          ) : showInvoiceMode ? (
            <InvoiceGenerator />
          ) : showScheduleMode ? (
            <WeeklySchedule isAdminMode={isAdminMode} />
          ) : (
            <MainDisplay />
          )}
        </div>
      </main>

      {/* Modals */}
      {showPasskeyModal && (
        <PasskeyModal
          onSubmit={handleAdminAccess}
          onClose={() => setShowPasskeyModal(false)}
        />
      )}

      {showPaidPasskeyModal && (
        <PasskeyModal
          onSubmit={handlePaidAccess}
          onClose={() => setShowPaidPasskeyModal(false)}
        />
      )}

      {showPaidModal && (
        <PaidModal
          onClose={() => setShowPaidModal(false)}
        />
      )}
    </div>
  );
};
