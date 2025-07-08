
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Download, Edit, Upload, Trash2 } from 'lucide-react';
import { useInvoiceStorage } from '@/hooks/useInvoiceStorage';
import { toast } from '@/hooks/use-toast';

interface InvoicePreviewProps {
  invoice: any;
  onEdit: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onEdit }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { downloadInvoicePDF } = useInvoiceStorage();
  const [companyLogo, setCompanyLogo] = useState<string | null>(
    localStorage.getItem('company_logo') || null
  );

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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        setCompanyLogo(logoUrl);
        localStorage.setItem('company_logo', logoUrl);
        toast({ title: "Company logo uploaded successfully!" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRemove = () => {
    setCompanyLogo(null);
    localStorage.removeItem('company_logo');
    toast({ title: "Company logo removed successfully!" });
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
    return invoice.subtotal || invoice.items?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
  };

  const calculateVat = () => {
    return invoice.vat || invoice.items?.filter((item: any) => item.isVat)
      .reduce((sum: number, item: any) => sum + (item.amount * 0.12), 0) || 0;
  };

  const calculateTotal = () => {
    return invoice.total || (calculateSubtotal() + calculateVat());
  };

  return (
    <div className="w-full space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        <Button onClick={onEdit} variant="outline" size="sm" className="flex-1 sm:flex-none">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm" className="flex-1 sm:flex-none">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownload} size="sm" className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <div className="flex gap-2">
          <label htmlFor="logo-upload">
            <Button variant="outline" size="sm" asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Logo
              </span>
            </Button>
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {companyLogo && (
            <Button
              onClick={handleLogoRemove}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Preview */}
      <Card className="w-full print:shadow-none print:border-none bg-white">
        <CardContent className="p-8" ref={invoiceRef}>
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-8">
            {/* Company Info */}
            <div className="flex items-start gap-4 mb-4 md:mb-0">
              {companyLogo && (
                <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded bg-white p-1">
                  <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    className="w-full h-full object-contain print:object-contain"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-700">{invoice.company?.name || 'Company Name'}</h2>
                <div className="text-sm text-slate-600 space-y-0.5">
                  {invoice.company?.address && <p>[{invoice.company.address}]</p>}
                  {(invoice.company?.municipality || invoice.company?.province || invoice.company?.zipCode) && (
                    <p>[{invoice.company?.municipality}, {invoice.company?.province} {invoice.company?.zipCode}]</p>
                  )}
                  {invoice.company?.phoneNumber && <p>Phone: [{invoice.company.phoneNumber}]</p>}
                  {invoice.company?.tin && <p>TIN: [{invoice.company.tin}]</p>}
                </div>
              </div>
            </div>

            {/* Invoice Header */}
            <div className="text-right">
              <h1 className="text-4xl font-bold text-blue-600 mb-4">INVOICE</h1>
              <div className="bg-slate-50 p-4 rounded border space-y-2">
                <div className="flex justify-between gap-8">
                  <span className="text-sm font-medium">DATE</span>
                  <span className="text-sm border-b border-dashed">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-sm font-medium">INVOICE #</span>
                  <span className="text-sm border-b border-dashed">[{invoice.invoiceNumber}]</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-sm font-medium">CUSTOMER ID</span>
                  <span className="text-sm border-b border-dashed">[{invoice.client?.id || '123'}]</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between gap-8">
                    <span className="text-sm font-medium">DUE DATE</span>
                    <span className="text-sm border-b border-dashed">{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="mb-6">
            <div className="bg-blue-600 text-white px-4 py-2 font-bold">
              BILL TO
            </div>
            <div className="border border-t-0 p-4 bg-slate-50">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">[{invoice.client?.name || invoice.clientName || 'Name'}]</p>
                <p>[{invoice.client?.name || invoice.clientName || 'Company Name'}]</p>
                {invoice.client?.address && <p>[{invoice.client.address}]</p>}
                {(invoice.client?.municipality || invoice.client?.province || invoice.client?.zipCode) && (
                  <p>[{invoice.client?.municipality}, {invoice.client?.province} {invoice.client?.zipCode}]</p>
                )}
                {invoice.client?.phoneNumber && <p>[{invoice.client.phoneNumber}]</p>}
                {invoice.client?.tin && <p>TIN: [{invoice.client.tin}]</p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-white text-left px-3 py-2 font-bold">DESCRIPTION</th>
                  <th className="border border-white text-center px-3 py-2 font-bold w-20">TAXED</th>
                  <th className="border border-white text-right px-3 py-2 font-bold w-24">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item: any, index: number) => (
                  <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border px-3 py-2">
                      <div>
                        <div className="font-medium">[{item.description}]</div>
                        <div className="text-sm text-slate-600">[{item.quantity} x ₱{item.rate?.toFixed(2) || '0.00'}]</div>
                      </div>
                    </td>
                    <td className="border px-3 py-2 text-center">
                      {item.isVat ? 'X' : ''}
                    </td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      ₱{item.amount?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
                {/* Empty rows for spacing */}
                {Array.from({ length: Math.max(0, 8 - (invoice.items?.length || 0)) }).map((_, index) => (
                  <tr key={`empty-${index}`} className={(invoice.items?.length + index) % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border px-3 py-4">&nbsp;</td>
                    <td className="border px-3 py-4">&nbsp;</td>
                    <td className="border px-3 py-4">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comments Section */}
            <div>
              <div className="bg-blue-600 text-white px-4 py-2 font-bold">
                OTHER COMMENTS
              </div>
              <div className="border border-t-0 p-4 bg-slate-50 h-32">
                <div className="space-y-1 text-sm">
                  <p>1. Total payment due in 30 days</p>
                  <p>2. Please include the invoice number on your check</p>
                  {invoice.notes && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Totals Section */}
            <div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold">₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Taxable</span>
                  <span className="font-semibold">₱{calculateVat().toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Tax rate</span>
                  <span className="font-semibold">12%</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Tax due</span>
                  <span className="font-semibold">₱{(calculateVat() * 0.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Other</span>
                  <span className="font-semibold">₱0.00</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold bg-slate-100 px-3 rounded">
                  <span>TOTAL</span>
                  <span>₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-6 text-center text-sm">
                <p className="font-medium">Make all checks payable to</p>
                <p className="font-bold">[{invoice.company?.name || 'Your Company Name'}]</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4 mt-8">
            <p>© Copyright Time Tracker 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
