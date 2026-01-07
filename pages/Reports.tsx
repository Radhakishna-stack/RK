
import React from 'react';
import { 
  ChevronRight, Search, ArrowLeft, Crown, 
  FileText, ShoppingBag, Book, TrendingUp, 
  BarChart3, Landmark, UserCheck, Package, 
  Calculator, Receipt
} from 'lucide-react';

interface ReportsPageProps {
  onNavigate?: (tab: string) => void;
}

// Fix: Change default onNavigate to accept a string argument to match the interface signature
const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate = (_tab: string) => {} }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-50 -m-4">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-100">
         <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="text-slate-600 active:bg-slate-100 p-1 rounded-full transition-colors">
               <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports</h1>
         </div>
         <button className="text-slate-400 p-2">
            <Search className="w-6 h-6" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Transaction Reports */}
        <ReportSection title="Transaction">
          <ReportItem 
            label="Sale Report" 
            onClick={() => onNavigate('sale_report')} 
          />
          <ReportItem 
            label="Purchase Report" 
            onClick={() => {}} 
          />
          <ReportItem 
            label="Day Book" 
            onClick={() => {}} 
          />
          <ReportItem 
            label="Profit & Loss" 
            onClick={() => {}} 
          />
          <ReportItem 
            label="All Transactions Report" 
            onClick={() => {}} 
          />
          <ReportItem 
            label="Cashflow" 
            onClick={() => {}} 
          />
          <ReportItem 
            label="Balance Sheet" 
            isPremium 
            onClick={() => {}} 
          />
        </ReportSection>

        {/* Party Reports */}
        <ReportSection title="Party Reports">
          <ReportItem 
            label="Party Statement" 
            onClick={() => onNavigate('party_statement')} 
          />
          <ReportItem 
            label="Party Wise Profit & Loss" 
            isPremium 
            onClick={() => {}} 
          />
          <ReportItem 
            label="All Parties Report" 
            onClick={() => {}} 
            noBorder
          />
        </ReportSection>

        {/* Item/Stock Reports */}
        <ReportSection title="Item/Stock Reports">
          <ReportItem 
            label="Stock Summary Report" 
            onClick={() => onNavigate('items')} 
          />
          <ReportItem 
            label="Item wise Profit & Loss" 
            onClick={() => {}} 
          />
          <ReportItem 
            label="Stock Detail Report" 
            onClick={() => {}} 
            noBorder
          />
        </ReportSection>

        {/* GST Reports */}
        <ReportSection title="GST Reports">
          <ReportItem 
            label="GSTR-1" 
            onClick={() => {}} 
            noBorder
          />
        </ReportSection>
      </div>
    </div>
  );
};

const ReportSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-4 mb-4">
    <h3 className="px-5 py-3 text-sm font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
      {title}
    </h3>
    <div className="bg-white">
      {children}
    </div>
  </div>
);

interface ReportItemProps {
  label: string;
  isPremium?: boolean;
  onClick: () => void;
  noBorder?: boolean;
}

const ReportItem: React.FC<ReportItemProps> = ({ label, isPremium, onClick, noBorder }) => (
  <button 
    onClick={onClick}
    className={`w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-all text-left ${!noBorder ? 'border-b border-slate-50' : ''}`}
  >
    <div className="flex items-center gap-3">
      <span className="text-base font-medium text-slate-700 tracking-tight">{label}</span>
      {isPremium && (
        <div className="bg-purple-100 p-1 rounded-md">
           <Crown className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
        </div>
      )}
    </div>
    <ChevronRight className="w-5 h-5 text-slate-300" />
  </button>
);

export default ReportsPage;
