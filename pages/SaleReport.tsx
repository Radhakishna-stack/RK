
import React from 'react';
import { ArrowLeft, Calendar, Filter, Share2, ChevronDown } from 'lucide-react';

interface SaleReportPageProps {
  onNavigate: (tab: string) => void;
}

const SaleReportPage: React.FC<SaleReportPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-screen bg-[#F1F7FF] overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
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
            <button className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center text-white text-[10px] font-bold">
               Pdf
            </button>
            <button className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center text-white text-[10px] font-bold">
               xls
            </button>
         </div>
      </div>
      
      {/* Date Filter */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-100">
         <div className="flex items-center gap-1 text-slate-600 font-medium text-sm">
            <span>This Month</span>
            <ChevronDown className="w-4 h-4 text-blue-500" />
         </div>
         <div className="w-px h-5 bg-slate-200 mx-2"></div>
         <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-600">01/01/2026</span>
            <span className="text-xs font-medium text-slate-400">TO</span>
            <span className="text-xs font-bold text-slate-600">31/01/2026</span>
         </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white px-4 py-3 border-t border-slate-100 shadow-sm">
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
         <h2 className="text-lg font-bold text-slate-700 mb-2">No Data Available</h2>
         <p className="text-center text-slate-400 text-sm max-w-xs leading-relaxed">
           No data is available for this report. Please try again after making relevant changes.
         </p>
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
