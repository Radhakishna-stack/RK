
import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Save, Calendar, Bike, Phone, User, FileText, Receipt
} from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem, BankAccount } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const BillingPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice form fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [bikeNumber, setBikeNumber] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [serviceReminderDate, setServiceReminderDate] = useState('');

  // Payment fields
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Unpaid'>('Paid');
  const [selectedAccount, setSelectedAccount] = useState('CASH-01');

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    id: string;
    description: string;
    amount: number;
  }>>([]);

  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, accData, settings] = await Promise.all([
        dbService.getInventory(),
        dbService.getBankAccounts(),
        dbService.getSettings()
      ]);
      setInventory(invData);
      setAccounts(accData);

      // Generate invoice number
      const prefix = settings.transaction.prefixes.sale || 'INV-';
      setInvoiceNumber(prefix + Date.now());
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

  const handleRemoveItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSave = async (saveAndNew: boolean = false) => {
    if (!customerName || !bikeNumber || invoiceItems.length === 0) {
      alert('Please fill in customer details and add at least one item');
      return;
    }

    try {
      await dbService.generateInvoice({
        bikeNumber,
        customerName,
        customerPhone,
        details: invoiceItems.map(i => i.description).join(', '),
        items: invoiceItems,
        estimatedCost: 0,
        finalAmount: calculateTotal(),
        paymentStatus,
        accountId: selectedAccount,
        paymentMode,
        date: invoiceDate,
        docType: 'Sale',
        odometerReading: odometerReading ? parseInt(odometerReading) : undefined,
        serviceReminderDate: serviceReminderDate || undefined
      });

      if (saveAndNew) {
        // Reset form but keep payment mode
        setCustomerName('');
        setBikeNumber('');
        setCustomerPhone('');
        setOdometerReading('');
        setServiceReminderDate('');
        setInvoiceItems([]);
        setInvoiceDate(new Date().toISOString().split('T')[0]);

        // Generate new invoice number
        const settings = await dbService.getSettings();
        const prefix = settings.transaction.prefixes.sale || 'INV-';
        setInvoiceNumber(prefix + Date.now());

        alert('Invoice saved! Ready for next sale.');
      } else {
        alert('Invoice saved successfully!');
        // Could navigate to invoice list or dashboard here
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice. Please try again.');
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
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Add New Sale</h1>

          {/* Payment Mode Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Card', 'UPI'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setPaymentMode(mode);
                    // Auto-select account based on mode
                    if (mode === 'Cash') {
                      const cashAcc = accounts.find(a => a.type === 'Cash');
                      setSelectedAccount(cashAcc?.id || 'CASH-01');
                    } else {
                      const bankAcc = accounts.find(a => a.type !== 'Cash');
                      setSelectedAccount(bankAcc?.id || 'BANK-01');
                    }
                  }}
                  className={`
                    py-3 px-4 rounded-xl font-semibold text-sm transition-all
                    ${paymentMode === mode
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
                <Input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  icon={<User className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bike Number *</label>
                <Input
                  type="text"
                  value={bikeNumber}
                  onChange={(e) => setBikeNumber(e.target.value.toUpperCase())}
                  placeholder="MH12AB1234"
                  icon={<Bike className="w-5 h-5" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  icon={<Phone className="w-5 h-5" />}
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

        {/* Payment Status */}
        <Card>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Payment Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Paid', 'Pending', 'Unpaid'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPaymentStatus(status)}
                  className={`
                    p-3 rounded-xl font-semibold text-sm transition-all
                    ${paymentStatus === status
                      ? status === 'Paid' ? 'bg-green-600 text-white shadow-md'
                        : status === 'Pending' ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-600 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}
                  `}
                >
                  {status}
                </button>
              ))}
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
            <p className="text-3xl font-bold text-blue-600">₹{calculateTotal().toLocaleString()}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={!customerName || !bikeNumber || invoiceItems.length === 0}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save & New
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={!customerName || !bikeNumber || invoiceItems.length === 0}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
