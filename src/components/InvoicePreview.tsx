
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Download, Edit } from 'lucide-react';
import { useInvoiceStorage } from '@/hooks/useInvoiceStorage';
import { toast } from '@/hooks/use-toast';

interface InvoicePreviewProps {
  invoice: any;
  onEdit: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onEdit }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { downloadInvoicePDF } = useInvoiceStorage();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      await downloadInvoicePDF(invoice);
      toast({ title: "Invoice downloaded successfully!" });
    } catch (error) {
      toast({ title: "Failed to download invoice", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateSubtotal = () => {
    return invoice.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
  };

  return (
    <div className="w-full space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={onEdit} variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Invoice Preview */}
      <Card className="w-full print:shadow-none print:border-none">
        <CardContent className="p-6 md:p-8" ref={invoiceRef}>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">INVOICE</h1>
              <p className="text-lg text-gray-600">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right mt-4 md:mt-0">
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-lg font-semibold">{formatDate(invoice.issueDate)}</p>
              <p className="text-sm text-gray-600 mt-2">Currency</p>
              <p className="text-lg font-semibold">Philippine Peso (₱)</p>
            </div>
          </div>

          {/* From/To Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">FROM</h3>
              <div className="text-gray-800">
                <p className="font-semibold">Your Company</p>
                <p>Philippines</p>
                <p>Non-VAT</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">TO</h3>
              <div className="text-gray-800">
                <p className="font-semibold">{invoice.clientName}</p>
                {invoice.clientEmail && <p>{invoice.clientEmail}</p>}
                <p>Philippines</p>
                <p>Non-VAT</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">Description</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-600">Qty</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Unit Price</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">VAT</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item: any, index: number) => (
                    <tr key={item.id || index} className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-800">{item.description}</td>
                      <td className="py-3 px-2 text-center text-gray-800">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-gray-800">₱{item.rate.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-gray-600">No VAT</td>
                      <td className="py-3 px-2 text-right font-semibold text-gray-800">₱{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-1/2 lg:w-1/3">
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">₱{calculateSubtotal()?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">VAT (0%):</span>
                  <span className="font-semibold">₱0.00</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-200">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-lg font-bold text-blue-600">₱{invoice.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Due Date */}
          {invoice.dueDate && (
            <div className="mb-8">
              <p className="text-sm text-gray-600">Due Date: <span className="font-semibold">{formatDate(invoice.dueDate)}</span></p>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Notes</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>© Copyright Time Tracker 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
