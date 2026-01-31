

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, Save, Calendar, Bike, Phone, User, FileText, Receipt, Wallet, Banknote, ArrowLeft
} from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem, BankAccount, Invoice, Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { InvoicePreview } from '../components/InvoicePreview';
import { AutocompleteDropdown } from '../components/AutocompleteDropdown';

interface BillingPageProps {
  onNavigate: (tab: string) => void;
  defaultDocType?: 'Sale' | 'Estimate';
}

const BillingPage: React.FC<BillingPageProps> = ({ onNavigate, defaultDocType = 'Sale' }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice form fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [serviceReminderDate, setServiceReminderDate] = useState('');

  // Payment collection fields
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [selectedUpiAccount, setSelectedUpiAccount] = useState('');

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    id: string;
    description: string;
    amount: number;
  }>>([]);

  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  // Autocomplete state
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showBikeDropdown, setShowBikeDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // UX state
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, accData, custData, settings] = await Promise.all([
        dbService.getInventory(),
        dbService.getBankAccounts(),
        dbService.getCustomers(),
        dbService.getSettings()
      ]);
      setInventory(invData);
      setAccounts(accData);
      setCustomers(custData);

      // Set company info for invoice preview
      setCompanyName(settings.transaction.prefixes.firmName || 'Your Business');
      setCompanyAddress(settings.general.businessAddress || '');
      setCompanyPhone(settings.general.businessPhone || '');

      // Check if editing an existing invoice
      const editingInvoiceStr = localStorage.getItem('editingInvoice');
      if (editingInvoiceStr) {
        try {
          const editingInvoice: Invoice = JSON.parse(editingInvoiceStr);

          // Pre-fill form with invoice data
          setCustomerName(editingInvoice.customerName || '');
          setBikeNumber(editingInvoice.bikeNumber || '');
          setCustomerPhone(editingInvoice.customerPhone || '');
          setOdometerReading(editingInvoice.odometerReading?.toString() || '');
          setServiceReminderDate(editingInvoice.serviceReminderDate || '');
          setInvoiceDate(editingInvoice.date || new Date().toISOString().split('T')[0]);

          // Load invoice items
          if (editingInvoice.items && Array.isArray(editingInvoice.items)) {
            setInvoiceItems(editingInvoice.items);
          }

          // Load payment collections
          if (editingInvoice.paymentCollections) {
            setCashAmount(editingInvoice.paymentCollections.cash?.toString() || '');
            setUpiAmount(editingInvoice.paymentCollections.upi?.toString() || '');
          }

          // Clear the editing invoice from storage
          localStorage.removeItem('editingInvoice');
        } catch (error) {
          console.error('Error loading invoice for editing:', error);
          localStorage.removeItem('editingInvoice');
        }
      } else {
        // Generate invoice number for new invoice
        const prefix = settings.transaction.prefixes[defaultDocType === 'Estimate' ? 'estimate' : 'sale'] || (defaultDocType === 'Estimate' ? 'EST-' : 'INV-');
        setInvoiceNumber(prefix + Date.now());
        // Default to first non-cash account
        const firstBank = accData.find(a => a.type !== 'Cash');
        if (firstBank) setSelectedUpiAccount(firstBank.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItemDescription || !newItemAmount) return;

    const newItem = {
      id: Date.now().toString(),
      description: newItemDescription,
      amount: parseFloat(newItemAmount)
    };

    setInvoiceItems([...invoiceItems, newItem]);
    setNewItemDescription('');
    setNewItemAmount('');
  };

  const handleRemoveItem = useCallback((id: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  }, [invoiceItems]);

  // Memoize calculated values to avoid repeated computations
  const totalAmount = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  }, [invoiceItems]);

  const totalCollected = useMemo(() => {
    const cash = parseFloat(cashAmount) || 0;
    const upi = parseFloat(upiAmount) || 0;
    return cash + upi;
  }, [cashAmount, upiAmount]);

  const remainingBalance = useMemo(() => {
    return totalAmount - totalCollected;
  }, [totalAmount, totalCollected]);

  // Auto-fill customer details based on bike number
  const handleBikeNumberChange = useCallback((value: string) => {
    setBikeNumber(value.toUpperCase());

    // Filter for autocomplete
    if (value.trim()) {
      const filtered = customers.filter(c =>
        c.bikeNumber.toUpperCase().includes(value.toUpperCase())
      );
      setFilteredCustomers(filtered);
      setShowBikeDropdown(filtered.length > 0);
    } else {
      setShowBikeDropdown(false);
    }

    const customer = customers.find(c => c.bikeNumber === value.toUpperCase());
    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone || '');
      setShowBikeDropdown(false);
    }
  }, [customers]);

  // Auto-fill customer details based on customer name
  const handleCustomerNameChange = useCallback((value: string) => {
    setCustomerName(value);

    // Filter for autocomplete
    if (value.trim()) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowNameDropdown(filtered.length > 0);
    } else {
      setShowNameDropdown(false);
    }

    const customer = customers.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (customer) {
      setBikeNumber(customer.bikeNumber);
      setCustomerPhone(customer.phone || '');
      setShowNameDropdown(false);
    }
  }, [customers]);

  // Auto-fill customer details based on phone
  const handlePhoneChange = useCallback((value: string) => {
    setCustomerPhone(value);

    // Filter for autocomplete
    if (value.trim() && value.length >= 3) {
      const filtered = customers.filter(c =>
        c.phone && c.phone.includes(value)
      );
      setFilteredCustomers(filtered);
      setShowPhoneDropdown(filtered.length > 0);
    } else {
      setShowPhoneDropdown(false);
    }

    if (value.length >= 10) {
      const customer = customers.find(c => c.phone === value);
      if (customer) {
        setCustomerName(customer.name);
        setBikeNumber(customer.bikeNumber);
        setShowPhoneDropdown(false);
      }
    }
  }, [customers]);

  // Select customer from dropdown
  const selectCustomer = useCallback((customer: Customer) => {
    setCustomerName(customer.name);
    setBikeNumber(customer.bikeNumber);
    setCustomerPhone(customer.phone || '');
    setShowNameDropdown(false);
    setShowBikeDropdown(false);
    setShowPhoneDropdown(false);
  }, []);

  const handleSave = async (saveAndNew: boolean = false) => {
    // Validate required fields
    if (!customerName || !bikeNumber || invoiceItems.length === 0) {
      setValidationErrors({
        customerName: !customerName ? 'Required' : '',
        bikeNumber: !bikeNumber ? 'Required' : '',
        items: invoiceItems.length === 0 ? 'Add at least one item' : ''
      });
      alert('Please fill in customer details and add at least one item');
      return;
    }

    // Prevent double submission
    if (isSaving) return;

    setIsSaving(true);

    try {
      // Use memoized values instead of calling functions

      // Determine payment status based on collected amount
      let paymentStatus: 'Paid' | 'Pending' | 'Unpaid';
      if (totalCollected >= totalAmount) {
        paymentStatus = 'Paid';
      } else if (totalCollected > 0) {
        paymentStatus = 'Pending';
      } else {
        paymentStatus = 'Unpaid';
      }

      const cash = parseFloat(cashAmount) || 0;
      const upi = parseFloat(upiAmount) || 0;

      const invoiceData = {
        bikeNumber,
        customerName,
        customerPhone,
        details: invoiceItems.map(i => i.description).join(', '),
        items: invoiceItems,
        estimatedCost: 0,
        finalAmount: totalAmount,
        paymentStatus,
        accountId: 'CASH-01', // Default account
        paymentMode: cash > 0 && upi > 0 ? 'Cash+UPI' : cash > 0 ? 'Cash' : upi > 0 ? 'UPI' : 'None',
        date: invoiceDate,
        docType: defaultDocType,
        odometerReading: odometerReading ? parseInt(odometerReading) : undefined,
        serviceReminderDate: serviceReminderDate || undefined,
        paymentCollections: { cash, upi, upiAccountId: selectedUpiAccount }
      };

      const newInvoice = await dbService.generateInvoice(invoiceData);

      if (saveAndNew) {
        // Reset form
        setCustomerName('');
        setBikeNumber('');
        setCustomerPhone('');
        setOdometerReading('');
        setServiceReminderDate('');
        setInvoiceItems([]);
        setCashAmount('');
        setUpiAmount('');
        setInvoiceDate(new Date().toISOString().split('T')[0]);

        // Generate new invoice number
        const settings = await dbService.getSettings();
        const prefix = settings.transaction.prefixes[defaultDocType === 'Estimate' ? 'estimate' : 'sale'] || (defaultDocType === 'Estimate' ? 'EST-' : 'INV-');
        setInvoiceNumber(prefix + Date.now());

        alert(`${defaultDocType} saved! Ready for next.`);
      } else {
        // Show preview
        setSavedInvoice(newInvoice);
        setShowPreview(true);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      {/* Show preview if invoice saved */}
      {showPreview && savedInvoice ? (
        <InvoicePreview
          invoice={savedInvoice}
          onClose={() => setShowPreview(false)}
          onNewSale={() => {
            // Reset form
            setCustomerName('');
            setBikeNumber('');
            setCustomerPhone('');
            setOdometerReading('');
            setServiceReminderDate('');
            setInvoiceItems([]);
            setCashAmount('');
            setUpiAmount('');
            setInvoiceDate(new Date().toISOString().split('T')[0]);

            // Generate new invoice number
            dbService.getSettings().then(settings => {
              const prefix = settings.transaction.prefixes[defaultDocType === 'Estimate' ? 'estimate' : 'sale'] || (defaultDocType === 'Estimate' ? 'EST-' : 'INV-');
              setInvoiceNumber(prefix + Date.now());
            });

            setShowPreview(false);
            setSavedInvoice(null);
          }}
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhone={companyPhone}
        />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center gap-3">
              <button onClick={() => onNavigate(defaultDocType === 'Estimate' ? 'estimate' : 'home')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">
                {defaultDocType === 'Estimate' ? 'Create Estimate' : 'Add New Sale'}
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-4 py-6 space-y-6">
            {/* Invoice Details */}
            <Card>
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  Invoice Details
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice No.</label>
                    <Input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="INV-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      icon={<Calendar className="w-5 h-5" />}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer Details */}
            <Card>
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Details
                </h2>

                <div className="space-y-3">
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
                    <Input
                      type="text"
                      value={customerName}
                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                      placeholder="Enter customer name"
                      icon={<User className="w-5 h-5" />}
                    />
                    <AutocompleteDropdown
                      show={showNameDropdown}
                      customers={filteredCustomers}
                      onSelect={selectCustomer}
                      displayField="name"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bike Number *</label>
                    <Input
                      type="text"
                      value={bikeNumber}
                      onChange={(e) => handleBikeNumberChange(e.target.value)}
                      placeholder="MH12AB1234"
                      icon={<Bike className="w-5 h-5" />}
                    />
                    <AutocompleteDropdown
                      show={showBikeDropdown}
                      customers={filteredCustomers}
                      onSelect={selectCustomer}
                      displayField="bikeNumber"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <Input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="9876543210"
                      icon={<Phone className="w-5 h-5" />}
                    />
                    <AutocompleteDropdown
                      show={showPhoneDropdown}
                      customers={filteredCustomers}
                      onSelect={selectCustomer}
                      displayField="phone"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Odometer (km)</label>
                      <Input
                        type="number"
                        value={odometerReading}
                        onChange={(e) => setOdometerReading(e.target.value)}
                        placeholder="12345"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Next Service</label>
                      <Input
                        type="date"
                        value={serviceReminderDate}
                        onChange={(e) => setServiceReminderDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Add Items Section */}
            <Card>
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Items
                </h2>

                {/* Item List */}
                <div className="space-y-2">
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900">₹{item.amount.toLocaleString()}</p>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {invoiceItems.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p>No items added yet</p>
                    </div>
                  )}
                </div>

                {/* Add New Item */}
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">Add New Item</h4>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                    <input
                      type="text"
                      placeholder="Item description..."
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                      className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Button size="sm" onClick={handleAddItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Collection */}
            <Card>
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Payment Collection
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cash Amount</label>
                    <Input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0"
                      icon={<Banknote className="w-5 h-5" />}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">UPI Amount</label>
                    <Input
                      type="number"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      placeholder="0"
                      icon={<Wallet className="w-5 h-5" />}
                    />
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-600">Invoice Total:</span>
                    <span className="text-sm font-semibold text-slate-900">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-600">Total Collected:</span>
                    <span className="text-sm font-semibold text-blue-600">₹{totalCollected.toLocaleString()}</span>
                  </div>
                  {remainingBalance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-amber-600">Remaining Balance:</span>
                      <span className="text-sm font-bold text-amber-600">₹{remainingBalance.toLocaleString()}</span>
                    </div>
                  )}
                  {remainingBalance < 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600">Excess Amount:</span>
                      <span className="text-sm font-bold text-red-600">₹{Math.abs(remainingBalance).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sticky Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-2xl z-20">
            <div className="px-4 py-4 space-y-4">
              {/* Total Display */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Total Amount</h3>
                <p className="text-3xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSave(true)}
                  disabled={!customerName || !bikeNumber || invoiceItems.length === 0 || isSaving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save & New'}
                </Button>
                <Button
                  onClick={() => handleSave(false)}
                  disabled={!customerName || !bikeNumber || invoiceItems.length === 0 || isSaving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BillingPage;
