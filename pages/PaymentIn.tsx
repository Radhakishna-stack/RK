
import React, { useState, useEffect } from 'react';
import {
  Plus, Search, DollarSign, Calendar, User, CreditCard, Wallet, CheckCircle
} from 'lucide-react';
import { dbService } from '../db';
import { Invoice, Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const PaymentInPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, custData] = await Promise.all([
        dbService.getInvoices(),
        dbService.getCustomers()
      ]);
      // Show Pending and Unpaid invoices
      setInvoices(invData.filter(inv => inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Unpaid'));
      setCustomers(custData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.finalAmount.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsSubmitting(true);
    try {
      const amount = parseFloat(paymentAmount);

      // Update invoice payment status
      await dbService.updateInvoicePaymentStatus(selectedInvoice.id, 'Paid');

      // Record transaction
      await dbService.addTransaction({
        date: paymentDate,
        type: 'IN',
        amount: amount,
        description: `Payment received from ${selectedInvoice.customerName} for invoice #${selectedInvoice.id.slice(-8)}`,
        category: 'Payment',
        paymentMode: paymentMode,
        accountId: paymentMode === 'Cash' ? 'CASH-01' : 'BANK-01'
      });

      alert('Payment recorded successfully!');
      setIsModalOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      loadData();
    } catch (err) {
      alert('Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total pending
  const totalPending = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Collect Payment</h1>
        <p className="text-sm text-slate-600 mt-1">
          {invoices.length} pending payment{invoices.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Total Pending Card */}
      <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-100 mb-1">Total Pending</p>
            <h2 className="text-4xl font-bold">₹{totalPending.toLocaleString()}</h2>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </Card>

      {/* Search */}
      <Input
        type="text"
        placeholder="Search by customer name or bike number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="w-5 h-5" />}
      />

      {/* Pending Invoices */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? 'No matching invoices' : 'All payments collected!'}
              </h3>
              <p className="text-slate-600">
                {searchTerm ? 'Try a different search term' : 'Great job! No pending payments.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{invoice.customerName}</h3>
                    {invoice.paymentStatus === 'Pending' ? (
                      <Badge variant="warning" size="sm">Pending</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Unpaid</Badge>
                    )}
                  </div>

                  <p className="text-sm text-slate-600">Bike: {invoice.bikeNumber}</p>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>Invoice Date: {new Date(invoice.date).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-2">
                    <p className="text-2xl font-bold text-slate-900">₹{invoice.finalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <Button onClick={() => handleRecordPayment(invoice)}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment"
        size="md"
      >
        {selectedInvoice && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Info */}
            <Card padding="sm" className="bg-slate-50">
              <div className="text-sm">
                <p className="text-slate-600">Customer</p>
                <p className="font-semibold text-slate-900 text-lg">{selectedInvoice.customerName}</p>
                <p className="text-slate-600 mt-1">Invoice Amount: ₹{selectedInvoice.finalAmount.toLocaleString()}</p>
              </div>
            </Card>

            <Input
              label="Payment Amount"
              type="number"
              required
              placeholder="₹ 0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              icon={<DollarSign className="w-5 h-5" />}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Card', 'UPI'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`
                      p-3 rounded-xl font-semibold text-sm transition-all
                      ${paymentMode === mode
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                    `}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Payment Date"
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              icon={<Calendar className="w-5 h-5" />}
            />

            <div className="border-t border-slate-200 pt-4 mt-6 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PaymentInPage;
