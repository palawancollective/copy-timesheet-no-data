
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Printer, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceList } from './InvoiceList';
import { InvoicePreview } from './InvoicePreview';
import { useInvoiceStorage } from '@/hooks/useInvoiceStorage';
import { toast } from '@/hooks/use-toast';

export const InvoiceGenerator = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'preview'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { syncStatus, syncInvoices } = useInvoiceStorage();

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setActiveTab('create');
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setActiveTab('preview');
  };

  const handleSync = async () => {
    if (isOnline) {
      await syncInvoices();
      toast({ title: "Invoices synced successfully!" });
    } else {
      toast({ title: "Cannot sync while offline", variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-full space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Invoice Generator</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Sync Status */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-600" />
              ) : (
                <CloudOff className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={handleSync}
              variant="outline"
              size="sm"
              disabled={!isOnline}
              className="text-xs md:text-sm"
            >
              Sync
            </Button>
            
            <Button
              onClick={handleCreateInvoice}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Create
          </button>
          {selectedInvoice && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Preview
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full overflow-x-hidden">
        {activeTab === 'list' && (
          <InvoiceList onViewInvoice={handleViewInvoice} />
        )}
        {activeTab === 'create' && (
          <InvoiceForm 
            invoice={selectedInvoice}
            onSave={() => setActiveTab('list')}
          />
        )}
        {activeTab === 'preview' && selectedInvoice && (
          <InvoicePreview 
            invoice={selectedInvoice}
            onEdit={() => setActiveTab('create')}
          />
        )}
      </div>
    </div>
  );
};
