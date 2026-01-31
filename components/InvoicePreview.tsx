import React from 'react';
import { Invoice } from '../types';
import { Printer, Download, Share2, FileText, X, Phone, Bike, Calendar, Receipt } from 'lucide-react';
import { Button } from './ui/Button';

interface InvoicePreviewProps {
    invoice: Invoice;
    onClose: () => void;
    onNewSale: () => void;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
    invoice,
    onClose,
    onNewSale,
    companyName,
    companyAddress,
    companyPhone,
}) => {
    const handleWhatsAppShare = () => {
        const message = `
*${companyName}*
${companyAddress}
${companyPhone}

*INVOICE*
Invoice No: ${invoice.id}
Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}

*Customer Details*
Name: ${invoice.customerName}
Bike No: ${invoice.bikeNumber}
${invoice.customerPhone ? `Phone: ${invoice.customerPhone}` : ''}

*Items*
${invoice.items.map((item, i) => `${i + 1}. ${item.description} - ₹${item.amount.toLocaleString()}`).join('\n')}

*Payment Details*
Total Amount: ₹${invoice.finalAmount.toLocaleString()}
${invoice.paymentCollections ? `
Cash: ₹${invoice.paymentCollections.cash.toLocaleString()}
UPI: ₹${invoice.paymentCollections.upi.toLocaleString()}` : ''}
Payment Status: ${invoice.paymentStatus}

Thank you for your business!
    `.trim();

        const phone = invoice.customerPhone?.replace(/\D/g, '') || '';
        if (phone) {
            const url = `https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        } else {
            alert('No phone number available for this customer');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSavePDF = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header - Hide on print */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Invoice Preview</h1>
                        <p className="text-sm text-slate-600 mt-1">Review and share your invoice</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Invoice Preview - Printable */}
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
                    {/* Modern Header with Gradient */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 print:bg-white print:text-slate-900 print:border-b-4 print:border-blue-600">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">{companyName}</h1>
                                <div className="space-y-1 text-blue-50 print:text-slate-600">
                                    <p className="text-sm">{companyAddress}</p>
                                    <p className="text-sm font-medium">{companyPhone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="bg-white/20 print:bg-blue-50 rounded-lg px-4 py-2">
                                    <p className="text-xs uppercase tracking-wider opacity-90 print:text-blue-600">Invoice</p>
                                    <p className="text-2xl font-bold">{invoice.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Invoice Info and Customer Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Invoice Information */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-slate-900">Invoice Details</h3>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 text-sm">Invoice Date:</span>
                                        <span className="font-medium text-slate-900">
                                            {new Date(invoice.date).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    {invoice.serviceReminderDate && (
                                        <div className="flex justify-between pt-2 border-t border-slate-200">
                                            <span className="text-slate-600 text-sm">Next Service:</span>
                                            <span className="font-medium text-blue-600">
                                                {new Date(invoice.serviceReminderDate).toLocaleDateString('en-IN')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Receipt className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-slate-900">Bill To</h3>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-bold text-slate-900">{invoice.customerName}</p>
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Bike className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium">{invoice.bikeNumber}</span>
                                    </div>
                                    {invoice.customerPhone && (
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Phone className="w-4 h-4 text-blue-600" />
                                            <span>{invoice.customerPhone}</span>
                                        </div>
                                    )}
                                    {invoice.odometerReading && (
                                        <div className="text-sm text-slate-600 pt-2 border-t border-blue-200">
                                            Odometer: <span className="font-medium">{invoice.odometerReading} km</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items Table - Modern Design */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                                <h3 className="font-semibold text-slate-900">Items & Services</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200">
                                            <th className="text-left py-3 px-6 font-semibold text-slate-700 text-sm w-16">#</th>
                                            <th className="text-left py-3 px-6 font-semibold text-slate-700 text-sm">Description</th>
                                            <th className="text-right py-3 px-6 font-semibold text-slate-700 text-sm w-32">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoice.items.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-6 text-slate-600">{index + 1}</td>
                                                <td className="py-4 px-6 text-slate-900">{item.description}</td>
                                                <td className="py-4 px-6 text-right font-semibold text-slate-900">
                                                    ₹{item.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment Summary - Enhanced Design */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-4">Payment Summary</h3>

                                    {/* Payment Collections */}
                                    {invoice.paymentCollections && (invoice.paymentCollections.cash > 0 || invoice.paymentCollections.upi > 0) && (
                                        <div className="space-y-2 mb-4">
                                            {invoice.paymentCollections.cash > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Cash Payment:</span>
                                                    <span className="font-medium text-slate-900">₹{invoice.paymentCollections.cash.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {invoice.paymentCollections.upi > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">UPI Payment:</span>
                                                    <span className="font-medium text-slate-900">₹{invoice.paymentCollections.upi.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm pt-2 border-t border-slate-300">
                                                <span className="text-slate-700 font-medium">Total Paid:</span>
                                                <span className="font-semibold text-green-600">
                                                    ₹{((invoice.paymentCollections.cash || 0) + (invoice.paymentCollections.upi || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Status Badge */}
                                    <div className="inline-flex items-center gap-2">
                                        <span className="text-sm text-slate-600">Status:</span>
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${invoice.paymentStatus === 'Paid'
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : invoice.paymentStatus === 'Pending'
                                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                        : 'bg-red-100 text-red-700 border border-red-200'
                                                }`}
                                        >
                                            {invoice.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* Total Amount - Large Display */}
                                <div className="text-right">
                                    <p className="text-sm text-slate-600 mb-1">Total Amount</p>
                                    <p className="text-4xl font-bold text-blue-600">
                                        ₹{invoice.finalAmount.toLocaleString()}
                                    </p>

                                    {/* Balance Due if Pending */}
                                    {invoice.paymentStatus === 'Pending' && invoice.paymentCollections && (
                                        <div className="mt-3 pt-3 border-t border-slate-300">
                                            <p className="text-xs text-slate-600 mb-1">Balance Due</p>
                                            <p className="text-xl font-bold text-amber-600">
                                                ₹{(invoice.finalAmount - (invoice.paymentCollections.cash || 0) - (invoice.paymentCollections.upi || 0)).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Thank You Message */}
                        <div className="text-center py-4 border-t border-slate-200">
                            <p className="text-slate-600 text-sm">Thank you for your business!</p>
                            <p className="text-slate-500 text-xs mt-1">For any queries, please contact us</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Hide on print - Improved Layout */}
                <div className="mt-6 print:hidden">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>

                        {/* Primary Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <Button
                                onClick={handleWhatsAppShare}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share on WhatsApp
                            </Button>
                            <Button
                                onClick={handleSavePDF}
                                variant="outline"
                                className="w-full"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                className="w-full"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print Invoice
                            </Button>
                        </div>

                        {/* Secondary Action */}
                        <Button
                            onClick={onNewSale}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Create New Sale
                        </Button>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body { 
            margin: 0; 
            padding: 0; 
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:text-slate-900 {
            color: #0f172a !important;
          }
          .print\\:text-slate-600 {
            color: #475569 !important;
          }
          .print\\:border-b-4 {
            border-bottom-width: 4px !important;
          }
          .print\\:border-blue-600 {
            border-color: #2563eb !important;
          }
        }
      `}</style>
        </div>
    );
};
