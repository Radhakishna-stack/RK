
import React, { useState } from 'react';
import { ArrowLeft, Calendar, Filter, Share2, ChevronDown, Download } from 'lucide-react';

interface SaleReportPageProps {
  onNavigate: (tab: string) => void;
}

const SaleReportPage: React.FC<SaleReportPageProps> = ({ onNavigate }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="flex flex-col h-screen bg-[#F1F7FF] overflow-hidden -mx-4">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10 no-print">
         <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('home')} className="text-slate-700">
               <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">Sale Report</h1>
         </div>
         <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
               <Share2 className="w-4 h-4 text-white" />
               <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
            </button>
            <button 
              onClick={() => window.print()}
              className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-md active:scale-95 transition-all"
            >
               Pdf
            </button>
            <button 
              onClick={() => window.print()}
              className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-md active:scale-95 transition-all"
            >
               xls
            </button>
         </div>
      </div>
      
      {/* Date Filter */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-100 no-print">
         <div className="flex items-center gap-1 text-slate-600 font-bold text-[10px] uppercase">
            <span>Filter Period</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
               <Calendar className="w-3.5 h-3.5 text-blue-500" />
               <input 
                 type="date" 
                 className="text-[10px] font-bold text-slate-600 bg-slate-50 p-1 rounded border border-slate-100 outline-none"
                 value={startDate}
                 onChange={e => setStartDate(e.target.value)}
               />
            </div>
            <span className="text-[10px] font-medium text-slate-400">TO</span>
            <div className="flex items-center gap-2">
               <Calendar className="w-3.5 h-3.5 text-blue-500" />
               <input 
                 type="date" 
                 className="text-[10px] font-bold text-slate-600 bg-slate-50 p-1 rounded border border-slate-100 outline-none"
                 value={endDate}
                 onChange={e => setEndDate(e.target.value)}
               />
            </div>
         </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white px-4 py-3 border-t border-slate-100 shadow-sm no-print">
         <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-slate-600">Filters Applied:</span>
            <button className="flex items-center gap-1 border border-blue-200 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
               <Filter className="w-3 h-3" /> Filters
            </button>
         </div>
         <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
             <FilterChip label="URP User - All Users" />
             <FilterChip label="Txns Type - Sale & Cr. Note" />
             <FilterChip label="Party - All Party" />
         </div>
      </div>

      {/* Body / Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#EBF5FF]">
         <div className="mb-6 relative">
            <div className="w-24 h-32 bg-white rounded-xl border-2 border-blue-100 transform -rotate-12 absolute -left-6 top-2"></div>
            <div className="w-24 h-32 bg-white rounded-xl border-2 border-blue-100 transform -rotate-6 absolute -left-2 top-0"></div>
            <div className="w-24 h-32 bg-white rounded-xl border-2 border-blue-200 relative z-10 flex flex-col p-4 gap-3 shadow-sm">
               <div className="h-1.5 w-full bg-blue-50 rounded-full"></div>
               <div className="h-1.5 w-3/4 bg-blue-50 rounded-full"></div>
               <div className="h-1.5 w-full bg-blue-50 rounded-full"></div>
               <div className="h-1.5 w-full bg-blue-50 rounded-full"></div>
               <div className="mt-auto self-end w-4 h-1.5 bg-blue-500 rounded-full"></div>
            </div>
         </div>
         <h2 className="text-lg font-bold text-slate-700 mb-2 uppercase tracking-tighter">Sale Summary Table</h2>
         <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-xs leading-relaxed">
           Data Range: {startDate || 'Beginning'} - {endDate || 'Today'}.
         </p>
         
         <div className="mt-8 flex gap-4 no-print">
            <button 
              onClick={() => window.print()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
         </div>
      </div>
    </div>
  );
};

const FilterChip = ({ label }: { label: string }) => (
  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap">
    {label}
  </span>
);

export default SaleReportPage;
