
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
      <div style="padding: 40px; font-family: Arial, sans-serif; background: white; color: black;">
        <!-- Header Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
          <!-- Company Info -->
          <div style="display: flex; align-items: flex-start; gap: 16px;">
            ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" style="width: 80px; height: 80px; object-fit: contain;" />` : ''}
            <div>
              <h2 style="font-size: 20px; font-weight: bold; color: #475569; margin: 0 0 8px 0;">${invoice.company?.name || 'Company Name'}</h2>
              <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
                ${invoice.company?.address ? `<p style="margin: 2px 0;">[${invoice.company.address}]</p>` : ''}
                ${(invoice.company?.municipality || invoice.company?.province || invoice.company?.zipCode) ? 
                  `<p style="margin: 2px 0;">[${invoice.company?.municipality || ''}, ${invoice.company?.province || ''} ${invoice.company?.zipCode || ''}]</p>` : ''}
                ${invoice.company?.phoneNumber ? `<p style="margin: 2px 0;">Phone: [${invoice.company.phoneNumber}]</p>` : ''}
                ${invoice.company?.tin ? `<p style="margin: 2px 0;">TIN: [${invoice.company.tin}]</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Invoice Header -->
          <div style="text-align: right;">
            <h1 style="font-size: 48px; font-weight: bold; color: #2563eb; margin: 0 0 20px 0;">INVOICE</h1>
            <div style="background: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; gap: 32px; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 500;">DATE</span>
                <span style="font-size: 12px; border-bottom: 1px dashed #64748b;">${formatDate(invoice.issueDate)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 32px; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 500;">INVOICE #</span>
                <span style="font-size: 12px; border-bottom: 1px dashed #64748b;">[${invoice.invoiceNumber}]</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 32px; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 500;">CUSTOMER ID</span>
                <span style="font-size: 12px; border-bottom: 1px dashed #64748b;">[${invoice.client?.id || '123'}]</span>
              </div>
              ${invoice.dueDate ? `
                <div style="display: flex; justify-content: space-between; gap: 32px;">
                  <span style="font-size: 12px; font-weight: 500;">DUE DATE</span>
                  <span style="font-size: 12px; border-bottom: 1px dashed #64748b;">${formatDate(invoice.dueDate)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Bill To Section -->
        <div style="margin-bottom: 24px;">
          <div style="background: #2563eb; color: white; padding: 8px 16px; font-weight: bold;">
            BILL TO
          </div>
          <div style="border: 1px solid #2563eb; border-top: none; padding: 16px; background: #f8fafc;">
            <div style="font-size: 12px; line-height: 1.4;">
              <p style="font-weight: bold; margin: 2px 0;">[${invoice.client?.name || invoice.clientName || 'Name'}]</p>
              <p style="margin: 2px 0;">[${invoice.client?.name || invoice.clientName || 'Company Name'}]</p>
              ${invoice.client?.address ? `<p style="margin: 2px 0;">[${invoice.client.address}]</p>` : ''}
              ${(invoice.client?.municipality || invoice.client?.province || invoice.client?.zipCode) ? 
                `<p style="margin: 2px 0;">[${invoice.client?.municipality || ''}, ${invoice.client?.province || ''} ${invoice.client?.zipCode || ''}]</p>` : ''}
              ${invoice.client?.phoneNumber ? `<p style="margin: 2px 0;">[${invoice.client.phoneNumber}]</p>` : ''}
              ${invoice.client?.tin ? `<p style="margin: 2px 0;">TIN: [${invoice.client.tin}]</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
            <thead>
              <tr style="background: #2563eb; color: white;">
                <th style="border: 1px solid white; text-align: left; padding: 8px 12px; font-weight: bold;">DESCRIPTION</th>
                <th style="border: 1px solid white; text-align: center; padding: 8px 12px; font-weight: bold; width: 80px;">TAXED</th>
                <th style="border: 1px solid white; text-align: right; padding: 8px 12px; font-weight: bold; width: 100px;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map((item: any, index: number) => `
                <tr style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                  <td style="border: 1px solid #000; padding: 8px 12px;">
                    <div style="font-weight: 500;">[${item.description}]</div>
                    <div style="font-size: 11px; color: #64748b;">[${item.quantity} x ₱${(item.rate || 0).toFixed(2)}]</div>
                  </td>
                  <td style="border: 1px solid #000; padding: 8px 12px; text-align: center;">
                    ${item.isVat ? 'X' : ''}
                  </td>
                  <td style="border: 1px solid #000; padding: 8px 12px; text-align: right; font-weight: bold;">
                    ₱${(item.amount || 0).toFixed(2)}
                  </td>
                </tr>
              `).join('') || ''}
              ${Array.from({ length: Math.max(0, 8 - (invoice.items?.length || 0)) }).map((_, index) => `
                <tr style="background: ${(invoice.items?.length + index) % 2 === 0 ? 'white' : '#f8fafc'};">
                  <td style="border: 1px solid #000; padding: 16px 12px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 16px 12px;">&nbsp;</td>
                  <td style="border: 1px solid #000; padding: 16px 12px;">&nbsp;</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Bottom Section -->
        <div style="display: flex; gap: 24px;">
          <!-- Comments Section -->
          <div style="flex: 1;">
            <div style="background: #2563eb; color: white; padding: 8px 16px; font-weight: bold;">
              OTHER COMMENTS
            </div>
            <div style="border: 1px solid #2563eb; border-top: none; padding: 16px; background: #f8fafc; height: 120px;">
              <div style="font-size: 12px; line-height: 1.4;">
                <p style="margin: 2px 0;">1. Total payment due in 30 days</p>
                <p style="margin: 2px 0;">2. Please include the invoice number on your check</p>
                ${invoice.notes ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #64748b;">
                    <p style="white-space: pre-wrap; margin: 0;">${invoice.notes}</p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Totals Section -->
          <div style="flex: 1; max-width: 300px;">
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: 500;">Subtotal</span>
                <span style="font-weight: bold;">₱${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: 500;">Taxable</span>
                <span style="font-weight: bold;">₱${calculateVat().toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: 500;">Tax rate</span>
                <span style="font-weight: bold;">12%</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: 500;">Tax due</span>
                <span style="font-weight: bold;">₱${(calculateVat() * 0.12).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: 500;">Other</span>
                <span style="font-weight: bold;">₱0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px; font-size: 18px; font-weight: bold; background: #f1f5f9; border-radius: 4px;">
                <span>TOTAL</span>
                <span>₱${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div style="text-align: center; font-size: 12px; margin-top: 24px;">
              <p style="font-weight: 500; margin: 2px 0;">Make all checks payable to</p>
              <p style="font-weight: bold; margin: 2px 0;">[${invoice.company?.name || 'Your Company Name'}]</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px;">
          <p style="margin: 0;">© Copyright Time Tracker 2025</p>
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
