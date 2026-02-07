import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Filter, Eye, Edit, Calendar, X, FileText, ArrowRightLeft } from 'lucide-react';
import { dbService } from '../db';
import { Invoice } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InvoicePreview } from '../components/InvoicePreview';
import { DateFilter, DateRange } from '../components/ui/DateFilter';

interface EstimatePageProps {
  onNavigate: (tab: string) => void;
}

const EstimatePage: React.FC<EstimatePageProps> = ({ onNavigate }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);

  // View invoice modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await dbService.getInvoices();
      // Filter ONLY Estimates
      setInvoices(data.filter(inv => inv.docType === 'Estimate'));

      // Load company settings for invoice preview
      const settings = await dbService.getSettings();
      setCompanyName(settings.transaction.prefixes.firmName);
      setCompanyAddress(settings.general.businessAddress);
      setCompanyPhone(settings.general.businessPhone);
    } catch (error) {
      console.error('Error loading estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    // Store invoice in localStorage for editing
    localStorage.setItem('editingInvoice', JSON.stringify(invoice));
    // Navigate to estimate creation page
    onNavigate('new_estimate');
  };

  const handleConvertToSale = (invoice: Invoice) => {
    if (window.confirm(`Convert Estimate ${invoice.id} to Sale? This will create a new Sale Invoice.`)) {
      // Store invoice in localStorage for editing/converting
      localStorage.setItem('editingInvoice', JSON.stringify(invoice));
      // Navigate to BILLING page (New Sale)
      // Since defaultDocType there is 'Sale', it will detect type mismatch and treat as conversion
      onNavigate('new_sale');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this estimate?')) {
      await dbService.deleteInvoice(id); // Using deleteInvoice since they are stored in same table
      loadInvoices();
    }
  };

  const getFilteredInvoices = () => {
    let filtered = invoices;

    // Apply date filter
    if (dateStart && dateEnd) {
      const start = new Date(dateStart).setHours(0, 0, 0, 0);
      const end = new Date(dateEnd).setHours(23, 59, 59, 999);

      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.date).getTime();
        return invDate >= start && invDate <= end;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading estimates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estimates</h1>
          <p className="text-sm text-slate-600 mt-1">{invoices.length} estimates found</p>
        </div>
        <Button onClick={() => onNavigate('new_estimate')}>
          <Plus className="w-5 h-5 mr-2" />
          New Estimate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search estimates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <DateFilter onChange={(start, end) => {
          setDateStart(start);
          setDateEnd(end);
        }} />
      </div>

      {/* Estimates List */}
      <div className="space-y-4">
        {getFilteredInvoices().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No estimates found</h3>
            <p className="text-slate-600">Create a new estimate to get started</p>
          </div>
        ) : (
          getFilteredInvoices().map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewInvoice(invoice)}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{invoice.customerName}</h3>
                        <span className="text-sm text-slate-500">• {invoice.bikeNumber}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-mono">{invoice.id} • {new Date(invoice.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">₹{invoice.finalAmount.toLocaleString()}</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg mt-1">
                      Estimate
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConvertToSale(invoice);
                    }}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Convert to Sale
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditInvoice(invoice);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDelete(invoice.id, e)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showPreview && selectedInvoice && (
        <InvoicePreview
          invoice={selectedInvoice}
          onClose={() => setShowPreview(false)}
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhone={companyPhone}
        />
      )}
    </div>
  );
};

export default EstimatePage;
