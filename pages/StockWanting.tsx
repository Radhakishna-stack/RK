
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet, Download, Printer, Trash2,
  Loader2, Search, Calculator, Check, Plus,
  Save, X, FileCheck, FileArchive, ArrowLeft
} from 'lucide-react';
import { dbService } from '../db';
import { StockWantingItem } from '../types';

interface StockWantingPageProps {
  onNavigate: (tab: string) => void;
}

const StockWantingPage: React.FC<StockWantingPageProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<StockWantingItem[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Live Entry State (The bottom row)
  const [newEntry, setNewEntry] = useState({
    partNumber: '',
    itemName: '',
    quantity: '',
    rate: ''
  });

  const partNoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    loadInventory();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getStockWanting();
      setItems(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const data = await dbService.getInventory();
      setInventory(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(i =>
      i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const totalEstimate = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [filteredItems]);

  const handleCommitEntry = async () => {
    if (!newEntry.itemName || !newEntry.quantity) return;

    setIsSubmitting(true);
    try {
      const added = await dbService.addStockWantingItem({
        partNumber: newEntry.partNumber.toUpperCase(),
        itemName: newEntry.itemName.toUpperCase(),
        quantity: parseFloat(newEntry.quantity) || 1,
        rate: parseFloat(newEntry.rate) || 0
      });
      setItems(prev => [...prev, added]);
      setNewEntry({ partNumber: '', itemName: '', quantity: '', rate: '' });
      // Ensure focus returns to start of line for next entry
      setTimeout(() => partNoRef.current?.focus(), 50);
    } catch (err) {
      alert("Error saving row");
    } finally {
      setIsSubmitting(false);
      setShowSuggestions(false);
    }
  };

  // 2) Autocomplete Logic
  const handleItemNameChange = (value: string) => {
    setNewEntry({ ...newEntry, itemName: value });

    if (value.trim().length >= 1) { // Start searching after 1 char
      const filtered = inventory.filter(item =>
        item.itemName.toLowerCase().includes(value.toLowerCase()) ||
        (item.partNumber && item.partNumber.toLowerCase().includes(value.toLowerCase())) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(value.toLowerCase())) // Also check itemCode
      ).slice(0, 10); // Show top 10

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // 3) Handle Part Number Input logic (Reverse lookup)
  const handlePartNumberChange = (value: string) => {
    setNewEntry({ ...newEntry, partNumber: value });

    if (value.trim().length >= 2) {
      const filtered = inventory.filter(item =>
        (item.partNumber && item.partNumber.toLowerCase().includes(value.toLowerCase())) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 10);

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectInventoryItem = (item: any) => {
    setNewEntry({
      ...newEntry,
      partNumber: item.partNumber || item.itemCode || '',
      itemName: item.itemName || item.name, // Handle different field names
      rate: item.sellingPrice?.toString() || item.unitPrice?.toString() || ''
    });
    setShowSuggestions(false);
  };

  const handleDelete = async (id: string) => {
    await dbService.deleteStockWantingItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCloseAndExport = async () => {
    if (items.length === 0) {
      alert("List is empty. Nothing to export.");
      return;
    }

    const defaultName = `Wanting_List_${new Date().toLocaleDateString().replace(/\//g, '-')}`;
    const fileName = prompt("Enter a name for this Wanting List (e.g. Honda Spares Order):", defaultName);

    if (!fileName) return;

    try {
      setLoading(true);

      // 1. Generate & Export Excel (CSV)
      const headers = ["Part Number", "Item Name", "Quantity", "Rate", "Total"];
      const rows = items.map(i => [
        `"${i.partNumber.replace(/"/g, '""')}"`,
        `"${i.itemName.replace(/"/g, '""')}"`,
        i.quantity,
        i.rate,
        i.quantity * i.rate
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName.replace(/[^a-z0-9]/gi, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 2. Update PDF Header & Trigger Print
      const printTitle = document.getElementById('print-file-title');
      if (printTitle) printTitle.innerText = fileName.toUpperCase();

      // Small timeout to let the download start before opening print dialog
      setTimeout(() => {
        window.print();

        // 3. Finalize: Ask to Archive/Clear
        setTimeout(() => {
          if (window.confirm("Export complete. Would you like to CLEAR the current active list to start a fresh file?")) {
            clearList();
          } else {
            setLoading(false);
          }
        }, 500);
      }, 300);

    } catch (err) {
      console.error("Export failed:", err);
      alert("Export encountered an error. Please check browser permissions.");
      setLoading(false);
    }
  };

  const clearList = async () => {
    setLoading(true);
    try {
      // Use Promise.all to ensure all items are deleted from DB
      await Promise.all(items.map(item => dbService.deleteStockWantingItem(item.id)));
      setItems([]);
      alert("Registry cleared. Ready for new session.");
    } catch (err) {
      alert("Failed to clear some items. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500 max-w-5xl mx-auto px-1">
      {/* Header HUD */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 no-print">
        <div className="flex items-start gap-4">
          <button onClick={() => onNavigate('home')} className="mt-1 text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">Stock Wanting</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
              <FileSpreadsheet className="w-3 h-3 text-blue-500" /> Direct-Entry Tech Spreadsheet
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleCloseAndExport}
            disabled={items.length === 0 || loading}
            className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5" />}
            Finalize & Close File
          </button>
        </div>
      </header>

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 no-print">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
          <input
            type="text"
            placeholder="FILTER CURRENT LIST..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] focus:ring-4 focus:ring-blue-500/5 outline-none font-black text-[11px] uppercase tracking-widest transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-slate-900 px-6 py-4 rounded-[22px] flex items-center gap-4 text-white">
          <div className="flex flex-col">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Order Value</p>
            <p className="text-lg font-black text-blue-400 leading-none mt-1">₹{totalEstimate.toLocaleString()}</p>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <Calculator className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-12 text-center">#</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-40">Part Number</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Item Description</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-24 text-center">Qty</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-32 text-right">Rate (₹)</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-32 text-right">Subtotal</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20 no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-[10px] font-black text-slate-300 border-r border-slate-100 text-center">{idx + 1}</td>
                  <td className="px-6 py-4 text-[11px] font-black text-blue-600 uppercase tracking-wider border-r border-slate-100 font-mono">{item.partNumber || '--'}</td>
                  <td className="px-6 py-4 text-[11px] font-black text-slate-700 uppercase border-r border-slate-100">{item.itemName}</td>
                  <td className="px-6 py-4 text-[11px] font-black text-slate-700 border-r border-slate-100 text-center">{item.quantity}</td>
                  <td className="px-6 py-4 text-[11px] font-black text-slate-500 border-r border-slate-100 text-right">₹{item.rate.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[11px] font-black text-slate-900 border-r border-slate-100 text-right bg-slate-50/30">₹{(item.quantity * item.rate).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center no-print">
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors active:scale-90">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* LIVE ENTRY ROW - Spreadsheet Style */}
              {!searchTerm && (
                <tr className="bg-blue-50/50 group/entry no-print">
                  <td className="px-6 py-4 text-center">
                    <Plus className="w-4 h-4 text-blue-400 mx-auto" />
                  </td>
                  <td className="px-4 py-3 border-r border-blue-100">
                    <input
                      ref={partNoRef}
                      type="text"
                      placeholder="PART #"
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none px-2 py-1 text-[11px] font-black uppercase text-blue-700 transition-all placeholder:text-blue-200"
                      value={newEntry.partNumber}
                      onChange={e => handlePartNumberChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCommitEntry()}
                      onFocus={() => newEntry.partNumber.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-blue-100 relative">
                    <input
                      type="text"
                      placeholder="ENTER ITEM DESCRIPTION..."
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none px-2 py-1 text-[11px] font-black uppercase text-slate-700 transition-all placeholder:text-slate-300"
                      value={newEntry.itemName}
                      onChange={e => handleItemNameChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCommitEntry()}
                      onFocus={() => newEntry.itemName.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-blue-400 rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
                        {suggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectInventoryItem(item);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between gap-3"
                          >
                            <div className="flex-1">
                              <div className="text-[11px] font-black text-slate-900 uppercase">{item.itemName}</div>
                              {item.partNumber && (
                                <div className="text-[9px] font-mono text-blue-600 mt-1">{item.partNumber}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black text-green-600">₹{(item.sellingPrice || item.price || 0).toLocaleString()}</div>
                              <div className="text-[8px] text-slate-500">Stock: {item.quantity}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 border-r border-blue-100">
                    <input
                      type="number"
                      placeholder="QTY"
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none px-2 py-1 text-[11px] font-black text-center text-slate-700 transition-all placeholder:text-slate-300"
                      value={newEntry.quantity}
                      onChange={e => setNewEntry({ ...newEntry, quantity: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleCommitEntry()}
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-blue-100">
                    <input
                      type="number"
                      placeholder="RATE"
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none px-2 py-1 text-[11px] font-black text-right text-slate-700 transition-all placeholder:text-slate-300"
                      value={newEntry.rate}
                      onChange={e => setNewEntry({ ...newEntry, rate: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleCommitEntry()}
                    />
                  </td>
                  <td className="px-6 py-4 text-right border-r border-blue-100">
                    <span className="text-[11px] font-black text-blue-500 opacity-40">AUTO</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={handleCommitEntry}
                      disabled={!newEntry.itemName || !newEntry.quantity || isSubmitting}
                      className="p-2 bg-blue-600 text-white rounded-xl shadow-lg active:scale-95 disabled:opacity-20 transition-all"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              )}

              {filteredItems.length === 0 && !loading && searchTerm && (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <X className="w-12 h-12 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No matching results in current file</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredItems.length === 0 && loading && !searchTerm && (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-slate-400">Loading Order Registry...</p>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black text-xs uppercase">
              <tr>
                <td colSpan={5} className="px-6 py-6 text-right tracking-[0.2em] border-r border-white/5">Consolidated File Estimate</td>
                <td className="px-6 py-6 text-right text-lg tracking-tighter border-r border-white/5">₹{totalEstimate.toLocaleString()}</td>
                <td className="no-print bg-slate-800"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Direct Entry Instruction HUD */}
      <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-blue-900 uppercase">Quick Add Protocol</p>
            <p className="text-[10px] text-blue-600 font-medium">Type details in the blue row and hit <span className="font-black">ENTER</span> to commit. No modals required.</p>
          </div>
        </div>
        <FileCheck className="w-8 h-8 text-blue-200 hidden sm:block" />
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          table { border: 1px solid #e2e8f0 !important; font-size: 10px; width: 100% !important; margin: 0 !important; }
          th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; }
          tfoot { background: #000 !important; color: #fff !important; }
          .print-header { display: block !important; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .print-footer { display: block !important; position: fixed; bottom: 0; width: 100%; border-top: 1px solid #eee; padding-top: 10px; font-size: 8px; text-align: center; }
        }
      `}</style>

      <div className="hidden print:block print-header text-center space-y-3">
        <h1 className="text-3xl font-black uppercase tracking-tighter">MOTO GEAR SRK</h1>
        <h2 id="print-file-title" className="text-lg font-bold text-slate-700 uppercase tracking-widest border border-slate-900 inline-block px-6 py-2 rounded-lg">STOCK WANTING REGISTER</h2>
        <div className="flex justify-between items-center px-4 pt-4">
          <p className="text-[10px] font-black uppercase text-slate-500">Doc ID: {Date.now().toString().slice(-8)}</p>
          <p className="text-[10px] font-black uppercase text-slate-500">Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      <div className="hidden print:block print-footer">
        <p className="font-black uppercase tracking-[0.3em]">Confidential Procurement List • Moto Gear SRK Operations</p>
      </div>
    </div>
  );
};

export default StockWantingPage;
