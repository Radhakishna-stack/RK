import React from 'react';
import { Invoice } from '../types';
import { Printer, Download, Share2, FileText, X } from 'lucide-react';
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
        window.print(); // Browser will offer Save as PDF option
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header - Hide on print */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
                <div className="px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">Invoice Preview</h1>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Invoice Preview - Printable */}
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg p-8 print:shadow-none print:rounded-none">
                    {/* Company Header */}
                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{companyName}</h1>
                        <p className="text-slate-600">{companyAddress}</p>
                        <p className="text-slate-600">{companyPhone}</p>
                    </div>

                    {/* Invoice Details */}
                    <div className="mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">INVOICE</h2>
                                <p className="text-sm text-slate-600">
                                    <span className="font-semibold">Invoice No:</span> {invoice.id}
                                </p>
                                <p className="text-sm text-slate-600">
                                    <span className="font-semibold">Date:</span>{' '}
                                    {new Date(invoice.date).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="text-right">
                                <h3 className="font-semibold text-slate-900 mb-1">Bill To:</h3>
                                <p className="text-slate-900 font-medium">{invoice.customerName}</p>
                                <p className="text-slate-600">{invoice.bikeNumber}</p>
                                {invoice.customerPhone && (
                                    <p className="text-slate-600">{invoice.customerPhone}</p>
                                )}
                                {invoice.odometerReading && (
                                    <p className="text-sm text-slate-600">
                                        Odometer: {invoice.odometerReading} km
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="text-left py-2 px-2 font-semibold text-slate-900">S.No</th>
                                    <th className="text-left py-2 px-2 font-semibold text-slate-900">Description</th>
                                    <th className="text-right py-2 px-2 font-semibold text-slate-900">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-slate-200">
                                        <td className="py-3 px-2 text-slate-700">{index + 1}</td>
                                        <td className="py-3 px-2 text-slate-700">{item.description}</td>
                                        <td className="py-3 px-2 text-right text-slate-900 font-medium">
                                            ₹{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="border-t-2 border-slate-900 pt-4 mb-6">
                        <div className="flex justify-end">
                            <div className="w-64">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-lg font-semibold text-slate-900">Total Amount:</span>
                                    <span className="text-2xl font-bold text-slate-900">
                                        ₹{invoice.finalAmount.toLocaleString()}
                                    </span>
                                </div>

                                {/* Payment Collections */}
                                {invoice.paymentCollections && (invoice.paymentCollections.cash > 0 || invoice.paymentCollections.upi > 0) && (
                                    <div className="mt-4 pt-3 border-t border-slate-300">
                                        <p className="text-sm font-semibold text-slate-700 mb-2">Payment Received:</p>
                                        {invoice.paymentCollections.cash > 0 && (
                                            <div className="flex justify-between text-sm text-slate-600 mb-1">
                                                <span>Cash:</span>
                                                <span>₹{invoice.paymentCollections.cash.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {invoice.paymentCollections.upi > 0 && (
                                            <div className="flex justify-between text-sm text-slate-600 mb-1">
                                                <span>UPI:</span>
                                                <span>₹{invoice.paymentCollections.upi.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-semibold text-slate-900 mt-2 pt-2 border-t border-slate-200">
                                            <span>Total Paid:</span>
                                            <span>
                                                ₹{((invoice.paymentCollections.cash || 0) + (invoice.paymentCollections.upi || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                        {invoice.paymentStatus === 'Pending' && (
                                            <div className="flex justify-between text-sm font-semibold text-amber-600 mt-1">
                                                <span>Balance Due:</span>
                                                <span>
                                                    ₹{(invoice.finalAmount - (invoice.paymentCollections.cash || 0) - (invoice.paymentCollections.upi || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment Status Badge */}
                                <div className="mt-3">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${invoice.paymentStatus === 'Paid'
                                                ? 'bg-green-100 text-green-800'
                                                : invoice.paymentStatus === 'Pending'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {invoice.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    {invoice.serviceReminderDate && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-900">
                                <span className="font-semibold">Next Service Due:</span>{' '}
                                {new Date(invoice.serviceReminderDate).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t border-slate-300 text-center">
                        <p className="text-sm text-slate-600">Thank you for your business!</p>
                    </div>
                </div>

                {/* Action Buttons - Hide on print */}
                <div className="mt-6 print:hidden">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Share Invoice</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <Button
                                onClick={handleWhatsAppShare}
                                variant="outline"
                                className="w-full"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                WhatsApp
                            </Button>
                            <Button
                                onClick={handleSavePDF}
                                variant="outline"
                                className="w-full"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Save PDF
                            </Button>
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                className="w-full"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                        </div>
                        <Button
                            onClick={onNewSale}
                            className="w-full"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            New Sale
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
        }
      `}</style>
        </div>
    );
};
