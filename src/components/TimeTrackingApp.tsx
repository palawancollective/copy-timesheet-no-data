
import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, FileText, Calendar } from 'lucide-react';
import { MainDisplay } from './MainDisplay';
import { AdminPanel } from './AdminPanel';
import { PasskeyModal } from './PasskeyModal';
import { PaidModal } from './PaidModal';
import { InvoiceGenerator } from './InvoiceGenerator';
import { WeeklySchedule } from './schedule/WeeklySchedule';

export const TimeTrackingApp = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showPaidPasskeyModal, setShowPaidPasskeyModal] = useState(false);
  const [showInvoiceMode, setShowInvoiceMode] = useState(false);
  const [showScheduleMode, setShowScheduleMode] = useState(false);
  const [showInvoicePasskeyModal, setShowInvoicePasskeyModal] = useState(false);
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

  const handleInvoiceAccess = (passkey: string) => {
    if (passkey === '4467') {
      setShowInvoicePasskeyModal(false);
      setShowInvoiceMode(true);
      setShowScheduleMode(false);
      setIsAdminMode(false);
    } else {
      alert('Invalid passkey!');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setShowInvoiceMode(false);
    setShowScheduleMode(false);
  };

  const handlePaidButtonClick = () => {
    setShowPaidPasskeyModal(true);
  };

  const handleInvoiceButtonClick = () => {
    setShowInvoicePasskeyModal(true);
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
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b-4 border-primary">
        <div className="w-full px-4 py-3">
          {/* Logo - Centered at top for all devices */}
          <div className="flex justify-center mb-3">
            <button 
              onClick={() => {
                setIsAdminMode(false);
                setShowInvoiceMode(false);
                setShowScheduleMode(false);
              }}
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="/lovable-uploads/72a5877a-d50c-49a2-b13c-ecb0a56868e1.png" 
                alt="Binga Beach Logo" 
                className="h-10 w-auto object-contain"
              />
            </button>
          </div>

          {/* Mobile Layout */}
          <div className="flex flex-col space-y-3 md:hidden">
            {/* Time Display */}
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-primary">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(currentTime)}
              </div>
            </div>
            
            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={handlePaidButtonClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center text-xs"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Paid
              </button>
              <button
                onClick={handleInvoiceButtonClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Invoice
              </button>
              <button
                onClick={() => setShowPasskeyModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-2 rounded-lg font-semibold transition-colors text-xs col-span-2"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="text-3xl font-mono font-bold text-primary">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(currentTime)}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePaidButtonClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Paid
              </button>
              <button
                onClick={handleInvoiceButtonClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Invoice
              </button>
              <a
                href="https://onlineorder.palawancollective.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                Menu Management
              </a>
              <button
                onClick={() => setShowPasskeyModal(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-colors"
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
          ) : (
            <MainDisplay isAdminMode={isAdminMode} />
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

      {showInvoicePasskeyModal && (
        <PasskeyModal
          onSubmit={handleInvoiceAccess}
          onClose={() => setShowInvoicePasskeyModal(false)}
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
