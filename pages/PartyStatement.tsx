
import React from 'react';
import { ArrowLeft, Calendar, Filter, Share2, ChevronDown, Download } from 'lucide-react';

interface PartyStatementPageProps {
  onNavigate: (tab: string) => void;
}

const PartyStatementPage: React.FC<PartyStatementPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-screen bg-[#F0F8FF] overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-20 relative">
         <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('home')} className="text-slate-700 p-1 -ml-1">
               <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">Party Statement</h1>
         </div>
         <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
               <span className="text-white text-[10px] font-bold">CA</span>
               <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
               </div>
            </button>
            <button className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
               Pdf
            </button>
            <button className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
               xls
            </button>
         </div>
      </div>
      
      {/* Date Filter */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-100 z-10">
         <div className="flex items-center gap-1 text-slate-600 font-medium text-sm cursor-pointer">
            <span>This Month</span>
            <ChevronDown className="w-4 h-4 text-blue-500" />
         </div>
         <div className="w-px h-5 bg-slate-200 mx-2"></div>
         <div className="flex items-center gap-2 cursor-pointer">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-600">01/01/2026</span>
            <span className="text-xs font-medium text-slate-400">TO</span>
            <span className="text-xs font-bold text-slate-600">31/01/2026</span>
         </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white px-4 py-3 border-t border-slate-100 shadow-sm space-y-3 z-10">
         <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Filters Applied:</span>
            <button className="flex items-center gap-1 border border-blue-200 text-blue-600 px-4 py-1 rounded-full text-xs font-bold bg-white shadow-sm">
               <Filter className="w-3 h-3" /> Filters
            </button>
         </div>
         <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
             <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap">
                Theme - Vyapar View
             </span>
         </div>
      </div>

      {/* Blue Background Gradient Area */}
      <div className="flex-1 bg-gradient-to-b from-blue-100/50 to-blue-50 p-4 relative">
         
         {/* Select Party Dropdown */}
         <div className="bg-white rounded-lg p-3 flex justify-between items-center shadow-sm cursor-pointer border border-blue-100 hover:border-blue-300 transition-colors mb-12">
            <span className="text-slate-400 text-sm font-medium">Select Party</span>
            <ChevronDown className="w-5 h-5 text-blue-500" />
         </div>

         {/* Empty State Illustration */}
         <div className="flex flex-col items-center justify-center">
            <div className="relative mb-6">
                {/* Back Paper */}
                <div className="w-24 h-28 bg-white border-2 border-blue-100 rounded-lg transform -rotate-12 absolute -left-4 -top-2"></div>
                {/* Front Paper */}
                <div className="w-24 h-28 bg-white border-2 border-blue-200 rounded-lg relative z-10 flex flex-col p-3 gap-2 shadow-sm">
                   <div className="h-1.5 bg-blue-50 rounded w-full"></div>
                   <div className="h-1.5 bg-blue-50 rounded w-3/4"></div>
                   <div className="h-1.5 bg-blue-50 rounded w-full"></div>
                   <div className="h-1.5 bg-blue-50 rounded w-1/2"></div>
                   <div className="mt-auto self-end w-4 h-1.5 bg-blue-500 rounded-full"></div>
                </div>
            </div>
            <p className="text-center text-slate-500 text-sm max-w-[240px] leading-relaxed">
               To see the statement in full detail, please select a party.
            </p>
         </div>
      </div>
    </div>
  );
};

export default PartyStatementPage;
