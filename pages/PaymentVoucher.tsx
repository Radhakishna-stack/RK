import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, DollarSign, Smartphone, Save, History, Printer, CreditCard, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { dbService } from '../db';
import { Customer, PaymentReceipt, Invoice, Transaction } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { DateFilter } from '../components/ui/DateFilter';

interface PaymentReceiptPageProps {
    onNavigate: (tab: string) => void;
    initialMode?: 'receipt' | 'payment';
}

const PaymentReceiptPage: React.FC<PaymentReceiptPageProps> = ({ onNavigate, initialMode = 'receipt' }) => {
    // Voucher Type Toggle: 'receipt' (Money IN from Customer) vs 'payment' (Money OUT to Supplier)
    const [voucherType, setVoucherType] = useState<'receipt' | 'payment'>('receipt');

    useEffect(() => {
        if (initialMode) setVoucherType(initialMode);
    }, [initialMode]);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Customer[]>([]); // Reuse Customer type for suppliers
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Customer | null>(null);
    const [showCustomerList, setShowCustomerList] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cashAmount, setCashAmount] = useState<string>('');
    const [upiAmount, setUpiAmount] = useState<string>('');
    const [description, setDescription] = useState('');

    const [recentReceipts, setRecentReceipts] = useState<PaymentReceipt[]>([]);
    const [recentPayments, setRecentPayments] = useState<Transaction[]>([]); // For Payment Out history
    const [filteredReceipts, setFilteredReceipts] = useState<PaymentReceipt[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<Transaction[]>([]);

    const [dateStart, setDateStart] = useState<string | null>(null);
    const [dateEnd, setDateEnd] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Edit Mode State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
    const [unpaidPurchases, setUnpaidPurchases] = useState<Transaction[]>([]); // Purchase transactions

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setSelectedCustomer(null);
        setSelectedSupplier(null);
        setSearchTerm('');
        setCashAmount('');
        setUpiAmount('');
        setDescription('');
        setEditingId(null);
        setUnpaidInvoices([]);
        setUnpaidPurchases([]);
        setShowCustomerList(false);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [customersData, receiptsData, transactions] = await Promise.all([
                dbService.getCustomers(),
                dbService.getPaymentReceipts(),
                dbService.getTransactions()
            ]);

            setCustomers(customersData);
            setRecentReceipts(receiptsData);
            setFilteredReceipts(receiptsData);

            // Filter OUT transactions for Payment History
            const outTxns = transactions.filter(t => t.type === 'OUT' || t.type === 'expense'); // Expenses are also OUT
            // Actually 'expense' type is usually separate. 'OUT' is specifically for payments?
            // Let's stick to 'OUT' used by PurchaseEntry and this module.
            const payments = transactions.filter(t => t.type === 'OUT');
            setRecentPayments(payments);
            setFilteredPayments(payments);

            // Extract unique suppliers from purchase transactions
            const supplierNames = transactions
                .filter(t => t.type === 'purchase' && t.entityId)
                .map(t => t.entityId)
                .filter((v, i, a) => a.indexOf(v) === i); // Unique

            // Convert supplier names to Customer-like objects for UI consistency
            const supplierObjs = supplierNames.map((name, idx) => ({
                id: `SUP-${idx}`,
                name: name,
                phone: '',
                bikeNumber: '',
                loyaltyPoints: 0,
                createdAt: new Date().toISOString()
            } as Customer));

            setSuppliers(supplierObjs);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const activeList = voucherType === 'receipt' ? (showCustomerList ? customers : []) : (showCustomerList ? suppliers : []);
    const filteredList = activeList.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.bikeNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectParty = async (party: Customer) => {
        setSearchTerm(party.name);
        setShowCustomerList(false);
        if (voucherType === 'receipt') {
            setSelectedCustomer(party);
            // Fetch unpaid invoices
            try {
                const allInvoices = await dbService.getInvoices();
                const unpaid = allInvoices.filter(inv =>
                    inv.customerName === party.name &&
                    inv.paymentStatus !== 'Paid' &&
                    inv.docType !== 'Estimate'
                ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setUnpaidInvoices(unpaid);
            } catch (err) { console.error(err); }
        } else {
            setSelectedSupplier(party);
            // Fetch unpaid purchases (Credit)
            try {
                const transactions = await dbService.getTransactions();
                const unpaid = transactions.filter(t =>
                    t.type === 'purchase' &&
                    t.paymentMode === 'Credit' &&
                    t.entityId === party.name
                ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setUnpaidPurchases(unpaid);
            } catch (err) { console.error(err); }
        }
    };

    const handleEdit = (item: any) => {
        // ... (Logic needs to adapt for Payments too)
        // For now, let's keep Edit logic for receipts only, or adapt simplisticly
        if (voucherType === 'receipt') {
            const receipt = item as PaymentReceipt;
            // Find customer
            const customer = customers.find(c => c.id === receipt.customerId) || {
                id: receipt.customerId, name: receipt.customerName, phone: receipt.customerPhone, bikeNumber: receipt.bikeNumber || ''
            } as Customer;

            setSelectedCustomer(customer);
            setSearchTerm(customer.name);
            setEditingId(receipt.id);
            setDate(receipt.date);
            setCashAmount(receipt.cashAmount > 0 ? receipt.cashAmount.toString() : '');
            setUpiAmount(receipt.upiAmount > 0 ? receipt.upiAmount.toString() : '');
            setDescription(receipt.description || '');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Payment Edit
            const payment = item as Transaction;
            setSelectedSupplier({ name: payment.entityId, id: 'SUP-EDIT' } as Customer);
            setSearchTerm(payment.entityId);
            setEditingId(payment.id);
            setDate(payment.date.split('T')[0]);
            // Reverse engineer cash/upi from linked accounts? Hard without structure.
            // We'll just put total in 'Cash' or account type if available.
            // For simplicity, we assume one mode.
            setCashAmount(payment.amount.toString()); // Default to cash for edit
            setDescription(payment.description);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const applyDateFilter = (list: any[], start: string | null, end: string | null) => {
        if (!start || !end) {
            if (voucherType === 'receipt') setFilteredReceipts(list.slice(0, 10));
            else setFilteredPayments(list.slice(0, 10));
            return;
        }

        const startTime = new Date(start).setHours(0, 0, 0, 0);
        const endTime = new Date(end).setHours(23, 59, 59, 999);

        const filtered = list.filter(r => {
            const time = new Date(r.date).getTime();
            return time >= startTime && time <= endTime;
        });

        if (voucherType === 'receipt') setFilteredReceipts(filtered);
        else setFilteredPayments(filtered);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete this ${voucherType}?`)) {
            try {
                if (voucherType === 'receipt') {
                    await dbService.deletePaymentReceipt(id);
                    const data = await dbService.getPaymentReceipts();
                    setRecentReceipts(data);
                    setFilteredReceipts(data);
                } else {
                    await dbService.deleteTransaction(id);
                    const txns = await dbService.getTransactions();
                    const payments = txns.filter(t => t.type === 'OUT');
                    setRecentPayments(payments);
                    setFilteredPayments(payments);
                }
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    const handleSave = async () => {
        if (voucherType === 'receipt' && !selectedCustomer) { alert('Select customer'); return; }
        if (voucherType === 'payment' && !selectedSupplier) { alert('Select supplier'); return; }

        const cash = parseFloat(cashAmount) || 0;
        const upi = parseFloat(upiAmount) || 0;
        const total = cash + upi;

        if (total <= 0) { alert('Enter amount > 0'); return; }

        setSubmitting(true);
        try {
            if (voucherType === 'receipt') {
                // ... Existing Receipt Logic ...
                // Process Invoices (Auto-allocate)
                let remainingPayment = total;
                const updatedInvoices: string[] = [];

                // distribute numeric amounts
                let currentCash = cash;
                let currentUpi = upi;

                for (const invoice of unpaidInvoices) {
                    if (remainingPayment <= 0) break;
                    const invTotal = invoice.finalAmount;
                    const invPaid = (invoice.paymentCollections?.cash || 0) + (invoice.paymentCollections?.upi || 0);
                    const invBalance = invTotal - invPaid;
                    if (invBalance <= 0) continue;
                    const paymentForThis = Math.min(invBalance, remainingPayment);

                    let cashForThis = 0;
                    let upiForThis = 0;
                    if (currentCash >= paymentForThis) {
                        cashForThis = paymentForThis;
                        currentCash -= paymentForThis;
                    } else {
                        cashForThis = currentCash;
                        currentCash = 0;
                        upiForThis = paymentForThis - cashForThis;
                        currentUpi -= upiForThis;
                    }
                    if (paymentForThis > 0) {
                        const newCollections = {
                            cash: (invoice.paymentCollections?.cash || 0) + cashForThis,
                            upi: (invoice.paymentCollections?.upi || 0) + upiForThis,
                            upiAccountId: invoice.paymentCollections?.upiAccountId
                        };
                        const newTotalPaid = newCollections.cash + newCollections.upi;
                        const newStatus = newTotalPaid >= invTotal ? 'Paid' : 'Pending';
                        await dbService.updateInvoice(invoice.id, {
                            ...invoice,
                            paymentCollections: newCollections,
                            paymentStatus: newStatus,
                            paymentMode: newCollections.cash > 0 && newCollections.upi > 0 ? 'Cash+UPI' : newCollections.cash > 0 ? 'Cash' : newCollections.upi > 0 ? 'UPI' : 'None'
                        });
                        updatedInvoices.push(invoice.id);
                        remainingPayment -= paymentForThis;
                    }
                }

                const autoDescription = updatedInvoices.length > 0 ? ` (Covers: ${updatedInvoices.join(', ')})` : '';

                if (editingId) {
                    await dbService.updatePaymentReceipt(editingId, {
                        customerId: selectedCustomer!.id,
                        customerName: selectedCustomer!.name,
                        customerPhone: selectedCustomer!.phone,
                        bikeNumber: selectedCustomer!.bikeNumber,
                        cashAmount: cash,
                        upiAmount: upi,
                        totalAmount: total,
                        date: date,
                        description: description + autoDescription
                    });
                    alert('Receipt Updated!');
                } else {
                    await dbService.addPaymentReceipt({
                        customerId: selectedCustomer!.id,
                        customerName: selectedCustomer!.name,
                        customerPhone: selectedCustomer!.phone,
                        bikeNumber: selectedCustomer!.bikeNumber,
                        cashAmount: cash,
                        upiAmount: upi,
                        totalAmount: total,
                        date: date,
                        description: description + autoDescription
                    });
                    alert('Receipt Saved!');
                }
                const data = await dbService.getPaymentReceipts();
                setRecentReceipts(data);
                setFilteredReceipts(data);

            } else {
                // PAYMENT LOGIC
                // Link to Purchases?
                // We don't have structured 'PaymentCollections' on Purchases yet.
                // We just create an OUT transaction.
                // If we want to "Pay off" a purchase, we'd need to update that purchase transaction to say "Paid".
                // BUT current schema doesn't support partial payments easily on Purchase Txn.
                // So we just mark them "Paid" if full amount covered?
                // Or simple: Just record the Payment OUT.
                // Let's record OUT.

                const accounts = await dbService.getBankAccounts();
                let accountId = '';
                if (cash > 0) {
                    const acc = accounts.find(a => a.type === 'Cash');
                    if (acc) accountId = acc.id;
                } else if (upi > 0) {
                    const acc = accounts.find(a => a.type === 'UPI' || a.type === 'Savings' || a.type === 'Current' || a.type === 'UPI/Wallet');
                    if (acc) accountId = acc.id;
                }

                const txnData = {
                    type: 'OUT' as any,
                    amount: total,
                    category: 'Supplier Payment',
                    description: description || `Payment to ${selectedSupplier!.name}`,
                    date: date,
                    accountId: accountId || 'CASH-01',
                    entityId: selectedSupplier!.name,
                    paymentMode: cash > 0 && upi > 0 ? 'Split' : cash > 0 ? 'Cash' : 'UPI'
                }

                if (editingId) {
                    await dbService.updateTransaction(editingId, txnData);
                    alert('Payment Updated!');
                } else {
                    await dbService.addTransaction(txnData);
                    alert('Payment Voucher Saved!');
                }

                const txns = await dbService.getTransactions();
                const payments = txns.filter(t => t.type === 'OUT');
                setRecentPayments(payments);
                setFilteredPayments(payments);
            }

            resetForm();
        } catch (error) {
            console.error(error);
            alert('Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    // UI Renders logic...
    // (We need to update UI to use 'selectedParty', 'unpaidBills' generic names or conditional rendering)
    // To minimize large content replacement, I will try to map State to UI variables in Render

    // ...
    // Since I'm replacing the whole file logic anyway above to show changed handleSave/loadData...
    // I should provide the full component to be safe.

    // STARTING FULL FILE REPLACEMENT CONTENT BELOW
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
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">Payment Entry</h1>
                    <p className="text-sm text-slate-600">Unified Payments & Receipts</p>
                </div>
            </div>

            {/* Voucher Type Toggle */}
            <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-200 flex gap-2">
                <button onClick={() => { setVoucherType('receipt'); resetForm(); }} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${voucherType === 'receipt' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    💰 Receipt (Money IN)
                </button>
                <button onClick={() => { setVoucherType('payment'); resetForm(); }} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${voucherType === 'payment' ? 'bg-red-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    💸 Payment (Money OUT)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-6">
                    <Card>
                        <div className="space-y-4">
                            <h2 className="font-semibold text-lg text-slate-900 border-b pb-2 mb-4">
                                {editingId ? 'Edit Transaction' : (voucherType === 'receipt' ? 'New Receipt' : 'New Payment')}
                            </h2>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
                            </div>

                            {/* Party Search */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{voucherType === 'receipt' ? 'Customer' : 'Supplier'}</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${voucherType === 'receipt' ? 'Customer' : 'Supplier'}...`}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowCustomerList(true);
                                            if (searchTerm !== e.target.value) {
                                                if (voucherType === 'receipt') setSelectedCustomer(null);
                                                else setSelectedSupplier(null);
                                            }
                                        }}
                                        onFocus={() => setShowCustomerList(true)}
                                        className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>
                                {showCustomerList && searchTerm && filteredList.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {filteredList.map((p) => (
                                            <button key={p.id} onClick={() => handleSelectParty(p)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-0">
                                                <div className="font-medium text-slate-900">{p.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pending Bills */}
                            {(voucherType === 'receipt' ? unpaidInvoices.length > 0 : unpaidPurchases.length > 0) && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-amber-800 mb-2">Pending {voucherType === 'receipt' ? 'Invoices' : 'Bills'}</h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {voucherType === 'receipt' ? unpaidInvoices.map(inv => (
                                            <div key={inv.id} className="flex justify-between text-sm bg-white p-2 rounded border border-amber-100">
                                                <span>{inv.id} ({new Date(inv.date).toLocaleDateString()})</span>
                                                <span className="font-bold text-amber-600">₹{inv.finalAmount - ((inv.paymentCollections?.cash || 0) + (inv.paymentCollections?.upi || 0))}</span>
                                            </div>
                                        )) : unpaidPurchases.map(txn => (
                                            <div key={txn.id} className="flex justify-between text-sm bg-white p-2 rounded border border-amber-100">
                                                <span>{txn.description} ({new Date(txn.date).toLocaleDateString()})</span>
                                                <span className="font-bold text-amber-600">₹{txn.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Amounts */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-green-700 mb-1">Cash</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-green-600" />
                                        <input type="number" placeholder="0" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-1">UPI / Bank</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-blue-600" />
                                        <input type="number" placeholder="0" value={upiAmount} onChange={e => setUpiAmount(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl" />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Extras..." className="w-full px-4 py-2 border rounded-xl" />
                            </div>

                            {/* Submit */}
                            <button onClick={handleSave} disabled={submitting} className={`w-full py-3 rounded-xl font-bold text-white ${submitting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {submitting ? 'Saving...' : 'Save Record'}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* History */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-500" />
                            Recent {voucherType === 'receipt' ? 'Receipts' : 'Payments'}
                        </h2>
                        <button onClick={loadData} className="text-blue-600 text-sm font-semibold">Refresh</button>
                    </div>

                    <div className="space-y-3">
                        {voucherType === 'receipt' ? (
                            filteredReceipts.length === 0 ? <p className="text-center text-slate-500 py-10">No receipts found</p> : filteredReceipts.map(r => (
                                <Card key={r.id} padding="sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-slate-900">{r.customerName}</div>
                                            <div className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString()} • {r.receiptNumber}</div>
                                        </div>
                                        <div className="font-bold text-slate-900">₹{r.totalAmount}</div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => handleDelete(r.id, {} as any)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleEdit(r)} className="text-amber-500 hover:bg-amber-50 p-1 rounded"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            filteredPayments.length === 0 ? <p className="text-center text-slate-500 py-10">No payments found</p> : filteredPayments.map(p => (
                                <Card key={p.id} padding="sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-slate-900">{p.entityId}</div>
                                            <div className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()} • {p.description}</div>
                                        </div>
                                        <div className="font-bold text-red-600">-₹{p.amount}</div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => handleDelete(p.id, {} as any)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleEdit(p)} className="text-amber-500 hover:bg-amber-50 p-1 rounded"><Edit2 className="w-4 h-4" /></button>
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
