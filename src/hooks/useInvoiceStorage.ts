
import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const STORAGE_KEY = 'time_tracker_invoices';

export const useInvoiceStorage = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Get all invoices from localStorage
  const getInvoices = useCallback(async (): Promise<any[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const invoices = JSON.parse(stored);
      // Sort by creation date, newest first
      return invoices.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get invoices:', error);
      return [];
    }
  }, []);

  // Save an invoice
  const saveInvoice = useCallback(async (invoice: any) => {
    try {
      const invoices = await getInvoices();
      const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
      
      if (existingIndex >= 0) {
        invoices[existingIndex] = invoice;
      } else {
        invoices.unshift(invoice); // Add to beginning
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
      return invoice;
    } catch (error) {
      console.error('Failed to save invoice:', error);
      throw error;
    }
  }, [getInvoices]);

  // Delete an invoice
  const deleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      const invoices = await getInvoices();
      const filtered = invoices.filter(inv => inv.id !== invoiceId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      throw error;
    }
  }, [getInvoices]);

  // Download invoice as PDF
  const downloadInvoicePDF = useCallback(async (invoice: any) => {
    try {
      // Create a temporary div with the invoice content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.innerHTML = generateInvoiceHTML(invoice);
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  }, []);

  // Generate HTML for PDF
  const generateInvoiceHTML = (invoice: any) => {
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

    const companyLogo = localStorage.getItem('company_logo');

    return `
      <div style="padding: 40px; font-family: Arial, sans-serif; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" style="width: 64px; height: 64px; object-fit: contain;" />` : ''}
            <div>
              <h1 style="font-size: 36px; margin: 0; color: #333;">INVOICE</h1>
              <p style="font-size: 18px; color: #666; margin: 8px 0;">#${invoice.invoiceNumber}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="color: #666; margin: 0;">Date</p>
            <p style="font-size: 18px; font-weight: bold; margin: 4px 0;">${formatDate(invoice.issueDate)}</p>
            <p style="color: #666; margin: 16px 0 0 0;">Currency</p>
            <p style="font-size: 18px; font-weight: bold; margin: 4px 0;">Philippine Peso (₱)</p>
          </div>
        </div>

        <div style="display: flex; gap: 60px; margin-bottom: 40px;">
          <div>
            <h3 style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px;">FROM</h3>
            <div>
              <p style="font-weight: bold; margin: 4px 0;">${invoice.company?.name || 'Your Company'}</p>
              ${invoice.company?.tin ? `<p style="margin: 4px 0;">TIN: ${invoice.company.tin}</p>` : ''}
              ${invoice.company?.address ? `<p style="margin: 4px 0;">${invoice.company.address}</p>` : ''}
              ${invoice.company?.barangay ? `<p style="margin: 4px 0;">Brgy. ${invoice.company.barangay}</p>` : ''}
              ${invoice.company?.municipality ? `<p style="margin: 4px 0;">${invoice.company.municipality}</p>` : ''}
              ${invoice.company?.province ? `<p style="margin: 4px 0;">${invoice.company.province}</p>` : ''}
              ${invoice.company?.zipCode ? `<p style="margin: 4px 0;">${invoice.company.zipCode}</p>` : ''}
              ${invoice.company?.phoneNumber ? `<p style="margin: 4px 0;">${invoice.company.phoneNumber}</p>` : ''}
              <p style="margin: 4px 0;">${invoice.company?.isVat ? 'VAT 12%' : 'Non-VAT'}</p>
            </div>
          </div>
          <div>
            <h3 style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px;">TO</h3>
            <div>
              <p style="font-weight: bold; margin: 4px 0;">${invoice.client?.name || invoice.clientName || 'Client Name'}</p>
              ${(invoice.client?.email || invoice.clientEmail) ? `<p style="margin: 4px 0;">${invoice.client?.email || invoice.clientEmail}</p>` : ''}
              ${invoice.client?.tin ? `<p style="margin: 4px 0;">TIN: ${invoice.client.tin}</p>` : ''}
              ${invoice.client?.address ? `<p style="margin: 4px 0;">${invoice.client.address}</p>` : ''}
              ${invoice.client?.barangay ? `<p style="margin: 4px 0;">Brgy. ${invoice.client.barangay}</p>` : ''}
              ${invoice.client?.municipality ? `<p style="margin: 4px 0;">${invoice.client.municipality}</p>` : ''}
              ${invoice.client?.province ? `<p style="margin: 4px 0;">${invoice.client.province}</p>` : ''}
              ${invoice.client?.zipCode ? `<p style="margin: 4px 0;">${invoice.client.zipCode}</p>` : ''}
              ${invoice.client?.phoneNumber ? `<p style="margin: 4px 0;">${invoice.client.phoneNumber}</p>` : ''}
              <p style="margin: 4px 0;">${invoice.client?.isVat ? 'VAT 12%' : 'Non-VAT'}</p>
            </div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="border-bottom: 2px solid #ddd;">
              <th style="text-align: left; padding: 12px 8px; color: #666;">Description</th>
              <th style="text-align: center; padding: 12px 8px; color: #666;">Qty</th>
              <th style="text-align: right; padding: 12px 8px; color: #666;">Unit Price</th>
              <th style="text-align: right; padding: 12px 8px; color: #666;">VAT</th>
              <th style="text-align: right; padding: 12px 8px; color: #666;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map((item: any) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 8px;">${item.description}</td>
                <td style="text-align: center; padding: 12px 8px;">${item.quantity}</td>
                <td style="text-align: right; padding: 12px 8px;">₱${(item.rate || 0).toFixed(2)}</td>
                <td style="text-align: right; padding: 12px 8px;">${item.isVat ? 'VAT 12%' : 'No VAT'}</td>
                <td style="text-align: right; padding: 12px 8px; font-weight: bold;">₱${(item.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span>Subtotal:</span>
              <span style="font-weight: bold;">₱${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span>VAT (12%):</span>
              <span style="font-weight: bold;">₱${calculateVat().toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #ddd;">
              <span style="font-size: 18px; font-weight: bold;">Total:</span>
              <span style="font-size: 18px; font-weight: bold; color: #3b82f6;">₱${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        ${invoice.dueDate ? `
          <div style="margin-bottom: 40px;">
            <p style="color: #666;">Due Date: <span style="font-weight: bold;">${formatDate(invoice.dueDate)}</span></p>
          </div>
        ` : ''}

        ${invoice.notes ? `
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px;">Notes</h3>
            <p style="white-space: pre-wrap;">${invoice.notes}</p>
          </div>
        ` : ''}

        <div style="text-align: center; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 16px;">
          <p>© Copyright Time Tracker 2025</p>
        </div>
      </div>
    `;
  };

  // Sync with cloud (placeholder - would integrate with Supabase)
  const syncInvoices = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      // This would sync with Supabase in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate sync
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
      throw error;
    }
  }, []);

  return {
    getInvoices,
    saveInvoice,
    deleteInvoice,
    downloadInvoicePDF,
    syncInvoices,
    syncStatus
  };
};
