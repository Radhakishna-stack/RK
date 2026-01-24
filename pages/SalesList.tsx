
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Filter, Eye, Edit, Calendar } from 'lucide-react';
import { dbService } from '../db';
import { Invoice } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface SalesListPageProps {
    onNavigate: (tab: string) => void;
}

const SalesListPage: React.FC<SalesListPageProps> = ({ onNavigate }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const data = await dbService.getInvoices();
            setInvoices(data);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredInvoices = () => {
        let filtered = invoices;

        // Apply date filter
        if (filter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(inv => {
                const invDate = new Date(inv.date);

                if (filter === 'today') {
                    return invDate >= today;
                } else if (filter === 'week') {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return invDate >= weekAgo;
                } else if (filter === 'month') {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return invDate >= monthAgo;
                }
                return true;
            });
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(inv =>
                inv.customerName?.toLowerCase().includes(query) ||
                inv.bikeNumber?.toLowerCase().includes(query) ||
                inv.id?.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'bg-green-100 text-green-700';
            case 'Pending':
                return 'bg-amber-100 text-amber-700';
            case 'Unpaid':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const filteredInvoices = getFilteredInvoices();

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => onNavigate('home')} className="text-slate-700">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">Sales</h1>
                    </div>
                    <button
                        onClick={() => onNavigate('billing')}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Sale
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by customer, bike number, or invoice ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('today')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'today'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setFilter('week')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'week'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setFilter('month')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'month'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        This Month
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500">Loading sales...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No sales found</h3>
                        <p className="text-slate-500 mb-6">
                            {searchQuery ? 'Try a different search term' : 'Create your first sale to get started'}
                        </p>
                        <Button onClick={() => onNavigate('billing')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Sale
                        </Button>
                    </div>
                ) : (
                    filteredInvoices.map((invoice) => (
                        <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-900">{invoice.customerName}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(invoice.paymentStatus)}`}>
                                            {invoice.paymentStatus}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600">{invoice.bikeNumber}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(invoice.date)}
                                        </span>
                                        <span>#{invoice.id}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-blue-600">₹{invoice.finalAmount?.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Stats Summary */}
            {filteredInvoices.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Total Sales</p>
                            <p className="text-lg font-bold text-slate-900">{filteredInvoices.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Amount</p>
                            <p className="text-lg font-bold text-blue-600">
                                ₹{filteredInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Paid</p>
                            <p className="text-lg font-bold text-green-600">
                                {filteredInvoices.filter(inv => inv.paymentStatus === 'Paid').length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesListPage;
