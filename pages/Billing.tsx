
import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Bike, Phone, Receipt, Trash2, DollarSign, Calendar, Save,
  Printer, Eye, Share2, Download, MessageCircle, CheckCircle2
} from 'lucide-react';
import { dbService } from '../db';
import { Complaint, InventoryItem, BankAccount, Invoice } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const BillingPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    id: string;
    description: string;
    amount: number;
    gstRate?: number;
  }>>([]);

  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  // Payment fields
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Unpaid'>('Pending');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [selectedAccount, setSelectedAccount] = useState('CASH-01');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compData, invData, accData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getInventory(),
        dbService.getBankAccounts()
      ]);
      // Only show completed complaints (ready for billing)
      setComplaints(compData.filter(c => c.status === 'Completed'));
      setInventory(invData);
      setAccounts(accData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setInvoiceItems([{
      id: '1',
      description: complaint.details,
      amount: complaint.estimatedCost || 0
    }]);
    setIsInvoiceModalOpen(true);
    // Reset payment fields
    setPaymentStatus('Pending');
    setPaymentMode('Cash');
    setSelectedAccount('CASH-01');
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

  const handleGenerateInvoice = async () => {
    if (!selectedComplaint) return;

    try {
      await dbService.generateInvoice({
        complaintId: selectedComplaint.id,
        bikeNumber: selectedComplaint.bikeNumber,
        customerName: selectedComplaint.customerName,
        details: selectedComplaint.details,
        items: invoiceItems,
        estimatedCost: selectedComplaint.estimatedCost || 0,
        finalAmount: calculateTotal(),
        paymentStatus: paymentStatus,
        accountId: selectedAccount,
        paymentMode: paymentMode,
        date: new Date().toISOString(),
        docType: 'Sale'
      });

      const newInvoice = await dbService.generateInvoice({
        complaintId: selectedComplaint.id,
        bikeNumber: selectedComplaint.bikeNumber,
        customerName: selectedComplaint.customerName,
        details: selectedComplaint.details,
        items: invoiceItems,
        estimatedCost: selectedComplaint.estimatedCost || 0,
        finalAmount: calculateTotal(),
        paymentStatus: paymentStatus,
        accountId: selectedAccount,
        paymentMode: paymentMode,
        date: new Date().toISOString(),
        docType: 'Sale',
        odometerReading: selectedComplaint.odometerReading
      });

      setCreatedInvoice(newInvoice);
      setIsInvoiceModalOpen(false);
      setShowSuccessModal(true);
      setSelectedComplaint(null);
      setInvoiceItems([]);
      loadData();
    } catch (err) {
      alert('Failed to create invoice. Please try again.');
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleViewInvoice = () => {
    if (!createdInvoice) return;
    // In a real app, this would open invoice in new tab
    handlePrintInvoice();
  };

  const handleWhatsAppShare = () => {
    if (!createdInvoice) return;
    const message = `Invoice #${createdInvoice.id.slice(-8)} for ₹${createdInvoice.finalAmount.toLocaleString()}\nCustomer: ${createdInvoice.customerName}\nBike: ${createdInvoice.bikeNumber}`;
    dbService.sendWhatsApp(createdInvoice.customerName.split(' ')[0], message);
  };

  const handleSavePDF = () => {
    // Browser's print to PDF
    window.print();
  };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Invoice</h1>
        <p className="text-sm text-slate-600 mt-1">
          {complaints.length} completed jobs ready for billing
        </p>
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="Search by bike number or customer name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="w-5 h-5" />}
      />

      {/* Completed Jobs List */}
      <div className="space-y-3">
        {filteredComplaints.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? 'No matching jobs' : 'No completed jobs'}
              </h3>
              <p className="text-slate-600">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Complete service jobs to create invoices'}
              </p>
            </div>
          </Card>
        ) : (
          filteredComplaints.map((complaint) => (
            <Card key={complaint.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Bike className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-900">{complaint.bikeNumber}</h3>
                    <Badge variant="success" size="sm">Ready for Billing</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{complaint.customerName}</span>
                  </div>

                  <p className="text-sm text-slate-700">{complaint.details}</p>

                  {complaint.estimatedCost > 0 && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <DollarSign className="w-4 h-4" />
                      <span>Estimated: ₹{complaint.estimatedCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <Button onClick={() => handleSelectComplaint(complaint)}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Invoice Creation Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Create Invoice"
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6">
            {/* Customer Info */}
            <Card padding="sm" className="bg-slate-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Customer</p>
                  <p className="font-semibold text-slate-900">{selectedComplaint.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-600">Bike Number</p>
                  <p className="font-semibold text-slate-900">{selectedComplaint.bikeNumber}</p>
                </div>
              </div>
            </Card>

            {/* Invoice Items */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Invoice Items</h3>
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
              </div>
            </div>

            {/* Add New Item */}
            <div className="space-y-3 p-4 border-2 border-dashed border-slate-200 rounded-2xl">
              <h4 className="text-sm font-semibold text-slate-700">Add Item</h4>
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <input
                  type="text"
                  placeholder="Item description..."
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Button size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
              <h3 className="font-semibold text-slate-900">Payment Details</h3>

              {/* Payment Status */}
              <div className="space-y-1.5">
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

              {/* Payment Mode (only if Paid) */}
              {paymentStatus === 'Paid' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Payment Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Cash', 'UPI', 'Card'].map((mode) => (
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
                            p-3 rounded-xl font-semibold text-sm transition-all
                            ${paymentMode === mode
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}
                          `}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Account</label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Total */}
            <div className="pt-4 border-t-2 border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Total Amount</h3>
                <p className="text-3xl font-bold text-blue-600">₹{calculateTotal().toLocaleString()}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateInvoice}
                className="flex-1"
                disabled={invoiceItems.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillingPage;
