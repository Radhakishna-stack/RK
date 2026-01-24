import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, DollarSign, Smartphone, Save, History, Printer, CreditCard } from 'lucide-react';
import { dbService } from '../db';
import { Customer, PaymentReceipt } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

interface PaymentReceiptPageProps {
    onNavigate: (tab: string) => void;
}

const PaymentReceiptPage: React.FC<PaymentReceiptPageProps> = ({ onNavigate }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerList, setShowCustomerList] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cashAmount, setCashAmount] = useState<string>('');
    const [upiAmount, setUpiAmount] = useState<string>('');
    const [description, setDescription] = useState('');

    const [recentReceipts, setRecentReceipts] = useState<PaymentReceipt[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const customersData = await dbService.getCustomers();
            setCustomers(customersData);
            const receiptsData = await dbService.getPaymentReceipts();
            setRecentReceipts(receiptsData.slice(0, 10)); // Get last 10
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setSearchTerm(customer.name);
        setShowCustomerList(false);
    };

    const handleSave = async () => {
        if (!selectedCustomer) {
            alert('Please select a customer');
            return;
        }

        const cash = parseFloat(cashAmount) || 0;
        const upi = parseFloat(upiAmount) || 0;
        const total = cash + upi;

        if (total <= 0) {
            alert('Please enter an amount greater than 0');
            return;
        }

        setSubmitting(true);
        try {
            await dbService.addPaymentReceipt({
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                customerPhone: selectedCustomer.phone,
                bikeNumber: selectedCustomer.bikeNumber,
                cashAmount: cash,
                upiAmount: upi,
                totalAmount: total,
                date: date,
                description: description
            });

            // Reset form
            setSelectedCustomer(null);
            setSearchTerm('');
            setCashAmount('');
            setUpiAmount('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);

            // Reload receipts
            const receiptsData = await dbService.getPaymentReceipts();
            setRecentReceipts(receiptsData.slice(0, 10));

            alert('Payment Receipt Saved Successfully!');

        } catch (error) {
            console.error('Error saving receipt:', error);
            alert('Failed to save receipt');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = (receipt: PaymentReceipt) => {
        const printContent = `
      <html>
        <head>
          <title>Payment Receipt - ${receipt.receiptNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { border-top: 1px solid #000; border-bottom: 1px double #000; padding: 10px 0; margin: 10px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PAYMENT RECEIPT</h2>
            <p>Receipt No: ${receipt.receiptNumber}</p>
            <p>Date: ${new Date(receipt.date).toLocaleDateString('en-IN')}</p>
          </div>
          
          <div class="info">
            <div class="row">
              <span>Customer:</span>
              <span>${receipt.customerName}</span>
            </div>
            <div class="row">
              <span>Phone:</span>
              <span>${receipt.customerPhone}</span>
            </div>
            ${receipt.bikeNumber ? `
            <div class="row">
              <span>Bike:</span>
              <span>${receipt.bikeNumber}</span>
            </div>
            ` : ''}
          </div>
          
          <hr/>
          
          <div class="payment">
            ${receipt.cashAmount > 0 ? `
            <div class="row">
              <span>Cash Payment:</span>
              <span>₹${receipt.cashAmount.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            
            ${receipt.upiAmount > 0 ? `
            <div class="row">
              <span>UPI Payment:</span>
              <span>₹${receipt.upiAmount.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="total row">
            <span>TOTAL RECEIVED:</span>
            <span>₹${receipt.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          
          ${receipt.description ? `
          <div class="notes">
            <p><strong>Note:</strong> ${receipt.description}</p>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

        const win = window.open('', '_blank', 'width=400,height=600');
        if (win) {
            win.document.write(printContent);
            win.document.close();
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => onNavigate('home')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-700" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Payment Receipt</h1>
                    <p className="text-sm text-slate-600">Record customer payments (Cash & UPI)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Entry Form */}
                <div className="space-y-6">
                    <Card>
                        <div className="space-y-4">
                            <h2 className="font-semibold text-lg text-slate-900 border-b pb-2 mb-4">New Payment</h2>

                            {/* Date Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Customer Selection */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, phone or bike..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowCustomerList(true);
                                            if (selectedCustomer) setSelectedCustomer(null);
                                        }}
                                        onFocus={() => setShowCustomerList(true)}
                                        className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${!selectedCustomer && searchTerm && filteredCustomers.length === 0 ? 'border-red-300' : 'border-slate-200'
                                            }`}
                                    />
                                    {selectedCustomer && (
                                        <div className="absolute right-3 top-2 text-green-600">
                                            <span className="text-xs font-bold bg-green-100 px-2 py-1 rounded-full">✓ Selected</span>
                                        </div>
                                    )}
                                </div>

                                {/* Dropdown List */}
                                {showCustomerList && searchTerm && !selectedCustomer && filteredCustomers.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {filteredCustomers.map((customer) => (
                                            <button
                                                key={customer.id}
                                                onClick={() => handleSelectCustomer(customer)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                            >
                                                <div className="font-medium text-slate-900">{customer.name}</div>
                                                <div className="text-xs text-slate-500 flex justify-between">
                                                    <span>{customer.phone}</span>
                                                    <span>{customer.bikeNumber}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {showCustomerList && searchTerm && !selectedCustomer && filteredCustomers.length === 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-center text-sm text-slate-500">
                                        No customers found. Please add customer first.
                                    </div>
                                )}
                            </div>

                            {/* Amount Inputs */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-green-700 mb-1">Cash Amount</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-green-600" />
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={cashAmount}
                                            onChange={(e) => setCashAmount(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-1">UPI / Online</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-blue-600" />
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={upiAmount}
                                            onChange={(e) => setUpiAmount(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Total Display */}
                            <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                                <span className="font-semibold text-slate-700">Total Received:</span>
                                <span className="text-2xl font-bold text-slate-900">
                                    ₹{((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0)).toLocaleString('en-IN')}
                                </span>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Description</label>
                                <textarea
                                    placeholder="e.g. Advance for service, Spare parts payment..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                ></textarea>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={submitting || (!selectedCustomer)}
                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${submitting || !selectedCustomer
                                            ? 'bg-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1'
                                        }`}
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Receipt
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </Card>
                </div>

                {/* Recent Receipts List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-500" />
                            Recent Receipts
                        </h2>
                        <button
                            onClick={loadData}
                            className="text-sm text-blue-600 font-semibold hover:underline"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Loading history...</p>
                            </div>
                        ) : recentReceipts.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-100">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CreditCard className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">No receipts generated yet</p>
                                <p className="text-xs text-slate-400 mt-1">Create your first payment receipt</p>
                            </div>
                        ) : (
                            recentReceipts.map((receipt) => (
                                <Card key={receipt.id} padding="sm" className="hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-900">{receipt.customerName}</span>
                                                <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded-md">
                                                    {receipt.receiptNumber}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-2">
                                                {new Date(receipt.date).toLocaleDateString('en-IN')} • {receipt.customerPhone}
                                            </p>

                                            <div className="flex gap-2 text-xs">
                                                {receipt.cashAmount > 0 && (
                                                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" /> ₹{receipt.cashAmount}
                                                    </span>
                                                )}
                                                {receipt.upiAmount > 0 && (
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Smartphone className="w-3 h-3" /> ₹{receipt.upiAmount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-bold text-slate-900">₹{receipt.totalAmount.toLocaleString('en-IN')}</span>
                                            <button
                                                onClick={() => handlePrint(receipt)}
                                                className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Print Receipt"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentReceiptPage;
