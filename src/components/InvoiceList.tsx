
import React, { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInvoiceStorage } from '@/hooks/useInvoiceStorage';
import { FileText, Eye, Edit, Trash2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InvoiceListProps {
  onViewInvoice: (invoice: any) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onViewInvoice }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { getInvoices, deleteInvoice, downloadInvoicePDF } = useInvoiceStorage();

  const ITEMS_PER_PAGE = 10;

  const loadInvoices = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      const allInvoices = await getInvoices();
      const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const pageInvoices = allInvoices.slice(startIndex, endIndex);

      if (reset) {
        setInvoices(pageInvoices);
      } else {
        setInvoices(prev => [...prev, ...pageInvoices]);
      }

      setHasMore(endIndex < allInvoices.length);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast({ title: "Failed to load invoices", variant: "destructive" });
    }
  }, [getInvoices]);

  useEffect(() => {
    loadInvoices(1, true);
  }, [loadInvoices]);

  const fetchMoreInvoices = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadInvoices(nextPage);
  };

  const handleDelete = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice(invoiceId);
      toast({ title: "Invoice deleted successfully!" });
      // Reload invoices
      setPage(1);
      loadInvoices(1, true);
    }
  };

  const handleDownload = async (invoice: any) => {
    try {
      await downloadInvoicePDF(invoice);
      toast({ title: "Invoice downloaded successfully!" });
    } catch (error) {
      toast({ title: "Failed to download invoice", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (invoice: any) => {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    
    if (invoice.status === 'paid') return 'text-green-600 bg-green-100';
    if (dueDate < today) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusText = (invoice: any) => {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    
    if (invoice.status === 'paid') return 'Paid';
    if (dueDate < today) return 'Overdue';
    return 'Pending';
  };

  if (invoices.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No invoices found</h3>
          <p className="text-gray-500 text-center">Create your first invoice to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <InfiniteScroll
        dataLength={invoices.length}
        next={fetchMoreInvoices}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
        endMessage={
          <div className="text-center py-4 text-gray-500">
            <p>You've seen all invoices!</p>
          </div>
        }
        className="space-y-4"
      >
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="w-full hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Invoice Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {invoice.invoiceNumber}
                    </h3>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice)}`}>
                      {getStatusText(invoice)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Client:</span> {invoice.clientName}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(invoice.issueDate)}</p>
                    {invoice.dueDate && (
                      <p><span className="font-medium">Due:</span> {formatDate(invoice.dueDate)}</p>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">
                    ₱{invoice.total?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invoice.items?.length || 0} items
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => onViewInvoice(invoice)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  onClick={() => onViewInvoice(invoice)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDownload(invoice)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  PDF
                </Button>
                <Button
                  onClick={() => handleDelete(invoice.id)}
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </InfiniteScroll>
    </div>
  );
};
