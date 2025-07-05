
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInvoiceStorage } from '@/hooks/useInvoiceStorage';
import { toast } from '@/hooks/use-toast';
import { Trash2, Plus, Save } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  isVat: boolean;
}

interface CompanyDetails {
  name: string;
  tin: string;
  isVat: boolean;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  zipCode: string;
  phoneNumber: string;
}

interface ClientDetails {
  name: string;
  email: string;
  tin: string;
  isVat: boolean;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  zipCode: string;
  phoneNumber: string;
}

interface InvoiceFormProps {
  invoice?: any;
  onSave: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSave }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    items: [] as InvoiceItem[],
    company: {
      name: '',
      tin: '',
      isVat: false,
      address: '',
      barangay: '',
      municipality: '',
      province: '',
      zipCode: '',
      phoneNumber: ''
    } as CompanyDetails,
    client: {
      name: '',
      email: '',
      tin: '',
      isVat: false,
      address: '',
      barangay: '',
      municipality: '',
      province: '',
      zipCode: '',
      phoneNumber: ''
    } as ClientDetails
  });

  const [savedCompanies, setSavedCompanies] = useState<CompanyDetails[]>([]);
  const [savedClients, setSavedClients] = useState<ClientDetails[]>([]);
  const [savedItems, setSavedItems] = useState<Omit<InvoiceItem, 'id'>[]>([]);

  const { saveInvoice } = useInvoiceStorage();

  // Fetch employees for time entries
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    // Load saved data from localStorage
    const companies = JSON.parse(localStorage.getItem('saved_companies') || '[]');
    const clients = JSON.parse(localStorage.getItem('saved_clients') || '[]');
    const items = JSON.parse(localStorage.getItem('saved_items') || '[]');
    setSavedCompanies(companies);
    setSavedClients(clients);
    setSavedItems(items);

    if (invoice) {
      setFormData(invoice);
    } else {
      // Generate invoice number
      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
      setFormData(prev => ({ ...prev, invoiceNumber: invoiceNum }));
    }
  }, [invoice]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      isVat: false
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const saveCompany = () => {
    if (!formData.company.name) {
      toast({ title: "Please enter company name", variant: "destructive" });
      return;
    }
    const updated = [...savedCompanies.filter(c => c.name !== formData.company.name), formData.company];
    setSavedCompanies(updated);
    localStorage.setItem('saved_companies', JSON.stringify(updated));
    toast({ title: "Company saved successfully!" });
  };

  const saveClient = () => {
    if (!formData.client.name) {
      toast({ title: "Please enter client name", variant: "destructive" });
      return;
    }
    const updated = [...savedClients.filter(c => c.name !== formData.client.name), formData.client];
    setSavedClients(updated);
    localStorage.setItem('saved_clients', JSON.stringify(updated));
    toast({ title: "Client saved successfully!" });
  };

  const saveItem = (item: InvoiceItem) => {
    if (!item.description) {
      toast({ title: "Please enter item description", variant: "destructive" });
      return;
    }
    const itemToSave = { description: item.description, quantity: item.quantity, rate: item.rate, amount: item.amount, isVat: item.isVat };
    const updated = [...savedItems.filter(i => i.description !== item.description), itemToSave];
    setSavedItems(updated);
    localStorage.setItem('saved_items', JSON.stringify(updated));
    toast({ title: "Item saved successfully!" });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => total + item.amount, 0);
  };

  const calculateVat = () => {
    return formData.items
      .filter(item => item.isVat)
      .reduce((total, item) => total + (item.amount * 0.12), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVat();
  };

  const handleSave = async () => {
    if (!formData.invoiceNumber || !formData.company.name || !formData.client.name) {
      toast({ title: "Please fill in invoice number, company name, and client name", variant: "destructive" });
      return;
    }

    const invoiceData = {
      ...formData,
      subtotal: calculateSubtotal(),
      vat: calculateVat(),
      total: calculateTotal(),
      id: invoice?.id || Date.now().toString(),
      createdAt: invoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveInvoice(invoiceData);
    toast({ title: "Invoice saved successfully!" });
    onSave();
  };

  const generateFromTimeEntries = (employeeId: string) => {
    // This would fetch time entries and convert them to invoice items
    // For now, adding a placeholder item
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: `Time worked - ${employees.find(e => e.id === employeeId)?.name}`,
      quantity: 40, // hours
      rate: employees.find(e => e.id === employeeId)?.hourly_rate || 0,
      amount: 40 * (employees.find(e => e.id === employeeId)?.hourly_rate || 0),
      isVat: false
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {invoice ? 'Edit Invoice' : 'Create New Invoice'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number *
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date
            </label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Company Section */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800">From (Company)</h3>
            <div className="flex gap-2">
              <Select onValueChange={(companyName) => {
                const company = savedCompanies.find(c => c.name === companyName);
                if (company) setFormData(prev => ({ ...prev, company }));
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load saved company" />
                </SelectTrigger>
                <SelectContent>
                  {savedCompanies.map((company) => (
                    <SelectItem key={company.name} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={saveCompany} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Save Company
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                value={formData.company.name}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, name: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number</label>
              <input
                type="text"
                value={formData.company.tin}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, tin: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="companyVat"
                checked={formData.company.isVat}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, isVat: e.target.checked } }))}
                className="rounded"
              />
              <label htmlFor="companyVat" className="text-sm font-medium text-gray-700">VAT 12%</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.company.address}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, address: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
              <input
                type="text"
                value={formData.company.barangay}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, barangay: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Municipality</label>
              <input
                type="text"
                value={formData.company.municipality}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, municipality: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
              <input
                type="text"
                value={formData.company.province}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, province: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                type="text"
                value={formData.company.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, zipCode: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={formData.company.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, company: { ...prev.company, phoneNumber: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Client Section */}
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-800">To (Client)</h3>
            <div className="flex gap-2">
              <Select onValueChange={(clientName) => {
                const client = savedClients.find(c => c.name === clientName);
                if (client) setFormData(prev => ({ ...prev, client }));
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load saved client" />
                </SelectTrigger>
                <SelectContent>
                  {savedClients.map((client) => (
                    <SelectItem key={client.name} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={saveClient} size="sm" className="bg-green-600 hover:bg-green-700">
                Save Client
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
              <input
                type="text"
                value={formData.client.name}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, name: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.client.email}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, email: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number</label>
              <input
                type="text"
                value={formData.client.tin}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, tin: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="clientVat"
                checked={formData.client.isVat}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, isVat: e.target.checked } }))}
                className="rounded"
              />
              <label htmlFor="clientVat" className="text-sm font-medium text-gray-700">VAT 12%</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.client.address}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, address: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
              <input
                type="text"
                value={formData.client.barangay}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, barangay: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Municipality</label>
              <input
                type="text"
                value={formData.client.municipality}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, municipality: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
              <input
                type="text"
                value={formData.client.province}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, province: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                type="text"
                value={formData.client.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, zipCode: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={formData.client.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, client: { ...prev.client, phoneNumber: e.target.value } }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Generate from Employee */}
        <div className="border rounded-lg p-4 bg-purple-50">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Quick Generate from Employee</h3>
          <Select onValueChange={generateFromTimeEntries}>
            <SelectTrigger>
              <SelectValue placeholder="Select employee to generate timesheet items" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name} - ₱{employee.hourly_rate}/hr
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoice Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Invoice Items</h3>
            <div className="flex gap-2">
              <Select onValueChange={(description) => {
                const savedItem = savedItems.find(i => i.description === description);
                if (savedItem) {
                  const newItem: InvoiceItem = {
                    id: Date.now().toString(),
                    ...savedItem
                  };
                  setFormData(prev => ({
                    ...prev,
                    items: [...prev.items, newItem]
                  }));
                }
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load saved item" />
                </SelectTrigger>
                <SelectContent>
                  {savedItems.map((item, index) => (
                    <SelectItem key={index} value={item.description}>
                      {item.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {formData.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg">
                <div className="col-span-12 md:col-span-4">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={item.isVat}
                      onChange={(e) => updateItem(item.id, 'isVat', e.target.checked)}
                      className="rounded"
                    />
                    <label className="text-xs">VAT</label>
                  </div>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <span className="text-sm font-medium">₱{item.amount.toFixed(2)}</span>
                </div>
                <div className="col-span-1">
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => saveItem(item)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {formData.items.length > 0 && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Subtotal:</span>
                  <span className="text-sm font-medium">₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">VAT (12%):</span>
                  <span className="text-sm font-medium">₱{calculateVat().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-blue-600">₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes or terms..."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Invoice
          </Button>
          <Button variant="outline" onClick={onSave}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
