
import React, { useState, useEffect } from 'react';
import { 
  Globe, Receipt, Printer, Landmark, MessageSquare, Users, Package, 
  Bell, Calculator, Check, Loader2, ChevronRight, Plus, Trash2, Lock,
  Monitor, Smartphone, Settings as SettingsIcon, ShieldCheck, CreditCard, Sparkles,
  Eye, X, Scissors, Barcode, Info, Edit2, Crown, Search, ArrowLeft, Minus,
  Truck, Hash, Percent, FileText, AlertCircle, RefreshCw, Menu as MenuIcon,
  MessageSquareMore, Download, BarChart3, Briefcase, Phone, MapPin, Coins,
  CalendarClock
} from 'lucide-react';
import { dbService } from '../db';
import { AppSettings } from '../types';

interface SettingsPageProps {
  initialSection?: string;
  onNavigate?: (tab: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ initialSection = 'general', onNavigate }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    dbService.getSettings().then(setSettings);
  }, []);

  const handleUpdate = (section: keyof AppSettings, updatedData: any) => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      [section]: { ...settings[section], ...updatedData }
    };
    setSettings(newSettings);
    dbService.updateSettings(newSettings);
  };

  const renderSection = () => {
    if (!settings) return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );

    switch (activeSection) {
      case 'reports':
        return (
          <div className="animate-in fade-in duration-300">
             <div className="flex items-center gap-4 p-4 bg-white border-b border-slate-100 sticky top-0 z-10 md:hidden">
               <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-700"><MenuIcon className="w-6 h-6" /></button>
               <h2 className="text-lg font-bold text-slate-800">Reports</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-32">
              <ReportCategory title="Transaction">
                <ReportItem label="Sale Report" onClick={() => onNavigate?.('sale_report')} />
                <ReportItem label="Purchase Report" onClick={() => {}} />
                <ReportItem label="Day Book" onClick={() => {}} />
                <ReportItem label="Profit & Loss" onClick={() => {}} />
                <ReportItem label="All Transactions Report" onClick={() => {}} />
                <ReportItem label="Cashflow" onClick={() => {}} />
                <ReportItem label="Balance Sheet" isPremium onClick={() => {}} />
              </ReportCategory>

              <ReportCategory title="Party Reports">
                <ReportItem label="Party Statement" onClick={() => onNavigate?.('party_statement')} />
                <ReportItem label="Party Wise Profit & Loss" isPremium onClick={() => {}} />
                <ReportItem label="All Parties Report" onClick={() => {}} noBorder />
              </ReportCategory>

              <ReportCategory title="Item/Stock Reports">
                <ReportItem label="Stock Summary Report" onClick={() => onNavigate?.('items')} />
                <ReportItem label="Item wise Profit & Loss" onClick={() => {}} />
                <ReportItem label="Stock Detail Report" onClick={() => {}} noBorder />
              </ReportCategory>

              <ReportCategory title="GST Reports">
                <ReportItem label="GSTR-1" onClick={() => {}} noBorder />
              </ReportCategory>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-8">
            <SettingsGroup title="Business Profile">
               <div className="space-y-4 px-6 pb-4 pt-2">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <MapPin className="w-3 h-3" /> Official Address
                   </label>
                   <textarea 
                     rows={3}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                     placeholder="Enter full company address..."
                     value={settings.general.businessAddress || ''}
                     onChange={(e) => handleUpdate('general', { businessAddress: e.target.value })}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <Phone className="w-3 h-3" /> Business Contact
                   </label>
                   <input 
                     type="tel"
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                     placeholder="+91 00000 00000"
                     value={settings.general.businessPhone || ''}
                     onChange={(e) => handleUpdate('general', { businessPhone: e.target.value })}
                   />
                 </div>
               </div>
            </SettingsGroup>

            <SettingsGroup title="Core System Settings">
              <ToggleRow 
                label="Passcode Protection" 
                desc="Protect your business data with a secure PIN" 
                checked={settings.general.passcodeEnabled} 
                onChange={(v) => handleUpdate('general', { passcodeEnabled: v })} 
              />
              {settings.general.passcodeEnabled && (
                <div className="pl-4 pb-4">
                  <input 
                    type="password" 
                    placeholder="Enter 4-digit PIN"
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-xs font-mono"
                    value={settings.general.passcode}
                    onChange={(e) => handleUpdate('general', { passcode: e.target.value })}
                  />
                </div>
              )}
              <ToggleRow 
                label="Stop Negative Stock" 
                desc="Prevent billing if item quantity is zero" 
                checked={settings.general.stopNegativeStock} 
                onChange={(v) => handleUpdate('general', { stopNegativeStock: v })} 
              />
              <ToggleRow 
                label="Audit Trail" 
                desc="Record all transaction edits and deletions" 
                checked={settings.general.auditTrail} 
                onChange={(v) => handleUpdate('general', { auditTrail: v })} 
              />
              <InputRow label="Base Currency Symbol" value={settings.general.currency} onChange={(v) => handleUpdate('general', { currency: v })} />
            </SettingsGroup>
          </div>
        );

      case 'transaction':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-8">
            <SettingsGroup title="Billing & Invoicing Rules">
              <ToggleRow label="Show Invoice Number" checked={settings.transaction.showInvoiceNumber} onChange={(v) => handleUpdate('transaction', { showInvoiceNumber: v })} />
              <ToggleRow label="Enable Invoice Preview" desc="Preview bill layout before final commit" checked={settings.transaction.enableInvoicePreview} onChange={(v) => handleUpdate('transaction', { enableInvoicePreview: v })} />
              <ToggleRow label="Inclusive Tax Pricing" desc="Prices entered include GST" checked={settings.transaction.inclusiveTax} onChange={(v) => handleUpdate('transaction', { inclusiveTax: v })} />
              <ToggleRow label="Round off Total" desc="Automatically round off to nearest Rupee" checked={settings.transaction.roundOffTransaction} onChange={(v) => handleUpdate('transaction', { roundOffTransaction: v })} />
              <ToggleRow label="Show Profit on Dashboard" checked={settings.transaction.showProfit} onChange={(v) => handleUpdate('transaction', { showProfit: v })} />
              <StepperRow 
                label="Overdue Days Limit" 
                desc="Days before an unpaid bill is flagged as overdue"
                value={settings.transaction.overdueDaysLimit || 15} 
                onChange={(v) => handleUpdate('transaction', { overdueDaysLimit: v })} 
              />
            </SettingsGroup>
            
            <SettingsGroup title="Document Prefixes">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputRow label="Firm Name" value={settings.transaction.prefixes.firmName} onChange={(v) => handleUpdate('transaction', { prefixes: { ...settings.transaction.prefixes, firmName: v } })} />
                <InputRow label="Invoice Prefix" value={settings.transaction.prefixes.sale} onChange={(v) => handleUpdate('transaction', { prefixes: { ...settings.transaction.prefixes, sale: v } })} />
                <InputRow label="Estimate Prefix" value={settings.transaction.prefixes.estimate} onChange={(v) => handleUpdate('transaction', { prefixes: { ...settings.transaction.prefixes, estimate: v } })} />
                <InputRow label="Payment In Prefix" value={settings.transaction.prefixes.paymentIn} onChange={(v) => handleUpdate('transaction', { prefixes: { ...settings.transaction.prefixes, paymentIn: v } })} />
              </div>
            </SettingsGroup>
          </div>
        );

      case 'transaction_message':
        const msgSett = settings.messages.transactionMessaging;
        const updateMsg = (update: any) => {
          handleUpdate('messages', {
            ...settings.messages,
            transactionMessaging: { ...msgSett, ...update }
          });
        };
        const updateAuto = (key: string, val: boolean) => {
          updateMsg({
            autoMsgTypes: { ...msgSett.autoMsgTypes, [key]: val }
          });
        };

        return (
          <div className="animate-in fade-in duration-300">
             <div className="flex items-center gap-4 p-4 bg-white border-b border-slate-100 sticky top-0 z-10">
               <button onClick={() => setActiveSection('general')} className="text-slate-700"><ArrowLeft className="w-6 h-6" /></button>
               <h2 className="text-lg font-bold text-slate-800">Transaction Message</h2>
            </div>
            
            <div className="bg-white divide-y divide-slate-50">
               <ToggleRow label="Send to party" checked={msgSett.sendToParty} onChange={(v) => updateMsg({sendToParty: v})} />
               <ToggleRow label="Send SMS Copy to Self" checked={msgSett.smsCopyToSelf} onChange={(v) => updateMsg({smsCopyToSelf: v})} isPremium />
               <ToggleRow label="Send Transaction Update SMS" checked={msgSett.txnUpdateSms} onChange={(v) => updateMsg({txnUpdateSms: v})} isPremium showRedDot />
               <ToggleRow label="Show Party's Current Balance" checked={msgSett.showPartyBalance} onChange={(v) => updateMsg({showPartyBalance: v})} />
               <ToggleRow label="Show web invoice link" checked={msgSett.showWebInvoiceLink} onChange={(v) => updateMsg({showWebInvoiceLink: v})} />
               <ToggleRow label="Automatically Share Invoices on Vyapar Network" checked={msgSett.autoShareVyapar} onChange={(v) => updateMsg({autoShareVyapar: v})} />
            </div>

            <div className="bg-slate-50 px-6 py-4 border-y border-slate-100">
               <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Select transactions for automatic messaging</h3>
            </div>

            <div className="bg-white divide-y divide-slate-50">
               <ToggleRow label="Sale" checked={msgSett.autoMsgTypes.sale} onChange={(v) => updateAuto('sale', v)} />
               <ToggleRow label="Purchase" checked={msgSett.autoMsgTypes.purchase} onChange={(v) => updateAuto('purchase', v)} />
               <ToggleRow label="Sale Return" checked={msgSett.autoMsgTypes.saleReturn} onChange={(v) => updateAuto('saleReturn', v)} />
               <ToggleRow label="Purchase Return" checked={msgSett.autoMsgTypes.purchaseReturn} onChange={(v) => updateAuto('purchaseReturn', v)} />
               <ToggleRow label="Estimate" checked={msgSett.autoMsgTypes.estimate} onChange={(v) => updateAuto('estimate', v)} />
               <ToggleRow label="Proforma Invoice" checked={msgSett.autoMsgTypes.proforma} onChange={(v) => updateAuto('proforma', v)} />
               <ToggleRow label="Payment-In" checked={msgSett.autoMsgTypes.paymentIn} onChange={(v) => updateAuto('paymentIn', v)} />
               <ToggleRow label="Payment-Out" checked={msgSett.autoMsgTypes.paymentOut} onChange={(v) => updateAuto('paymentOut', v)} />
               <ToggleRow label="Sale Order" checked={msgSett.autoMsgTypes.saleOrder} onChange={(v) => updateAuto('saleOrder', v)} />
               <ToggleRow label="Purchase Order" checked={msgSett.autoMsgTypes.purchaseOrder} onChange={(v) => updateAuto('purchaseOrder', v)} />
               <ToggleRow label="Delivery Challan" checked={msgSett.autoMsgTypes.deliveryChallan} onChange={(v) => updateAuto('deliveryChallan', v)} />
               <ToggleRow label="Cancelled Invoice" checked={msgSett.autoMsgTypes.cancelledInvoice} onChange={(v) => updateAuto('cancelledInvoice', v)} noBorder />
            </div>
          </div>
        );

      case 'gst':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-8">
            <SettingsGroup title="GST Compliance">
              <ToggleRow label="Enable GST Features" checked={settings.gst.enabled} onChange={(v) => handleUpdate('gst', { enabled: v })} />
              <ToggleRow label="Show HSN Code on Print" checked={settings.gst.showHsn} onChange={(v) => handleUpdate('gst', { showHsn: v })} />
              <ToggleRow label="Reverse Charge (RCM)" checked={settings.gst.rcm} onChange={(v) => handleUpdate('gst', { rcm: v })} />
              <ToggleRow label="State of Supply" checked={settings.gst.stateOfSupply} onChange={(v) => handleUpdate('gst', { stateOfSupply: v })} />
            </SettingsGroup>
          </div>
        );

      case 'print':
        return (
          <div className="space-y-1 animate-in fade-in duration-300">
            <div className="flex items-center gap-4 p-4 bg-white border-b border-slate-100 sticky top-0 z-10 no-print">
               <button onClick={() => setActiveSection('general')} className="text-slate-700"><ArrowLeft className="w-6 h-6" /></button>
               <h2 className="text-lg font-bold text-slate-800">Invoice Print</h2>
            </div>

            <div className="p-4 space-y-4 pb-32">
              <SettingsGroup title="Themes">
                <div className="flex items-center justify-between py-2 cursor-pointer group" onClick={() => {}}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Change Theme and Colors</span>
                    <Info className="w-4 h-4 text-slate-300" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </SettingsGroup>

              <SettingsGroup title="Printer Settings">
                <SelectRow label="Print text size" value={settings.print.textSize} options={['Small', 'Medium', 'Large']} onChange={(v) => handleUpdate('print', { textSize: v })} />
                <SelectRow label="Page size" value={settings.print.pageSize} options={['A4 (210 x 297 mm)', 'A5', 'Thermal 2"', 'Thermal 3"']} onChange={(v) => handleUpdate('print', { pageSize: v })} />
                <SelectRow label="Orientation" value={settings.print.orientation} options={['Portrait', 'Landscape']} onChange={(v) => handleUpdate('print', { orientation: v })} />
              </SettingsGroup>

              <SettingsGroup title="Company Info / Header" showEditIcon>
                <ToggleRow label="Show warning for unsaved changes" checked={settings.print.showUnsavedWarning} onChange={(v) => handleUpdate('print', { showUnsavedWarning: v })} />
                <ToggleRow label="Print Company Name" checked={settings.print.showCompanyName} onChange={(v) => handleUpdate('print', { showCompanyName: v })} />
                <SelectRow label="Company Name Text Size" value={settings.print.companyNameSize} options={['Small', 'Medium', 'Large']} onChange={(v) => handleUpdate('print', { companyNameSize: v })} />
                <ToggleRow label="Company Logo" checked={settings.print.showLogo} onChange={(v) => handleUpdate('print', { showLogo: v })} />
                <ToggleRow label="Address" checked={settings.print.showAddress} onChange={(v) => handleUpdate('print', { showAddress: v })} />
                <ToggleRow label="Email" checked={settings.print.showEmail} onChange={(v) => handleUpdate('print', { showEmail: v })} />
                <ToggleRow label="Phone number" checked={settings.print.showPhoneNumber} onChange={(v) => handleUpdate('print', { showPhoneNumber: v })} />
                <ToggleRow label="GSTIN on Sale" checked={settings.print.showGstin} onChange={(v) => handleUpdate('print', { showGstin: v })} />
                <ToggleRow label="Print Bill of Supply for non tax invoices" checked={settings.print.printBillOfSupply} onChange={(v) => handleUpdate('print', { printBillOfSupply: v })} />
                <StepperRow label="Extra spaces on top of PDF" value={settings.print.extraSpacesTop} onChange={(v) => handleUpdate('print', { extraSpacesTop: v })} />
                <ToggleRow label="Print Original/Duplicate" checked={settings.print.printOriginalDuplicate} onChange={(v) => handleUpdate('print', { printOriginalDuplicate: v })} />
              </SettingsGroup>

              <SettingsGroup title="Totals & Taxes">
                <StepperRow label="Min. No. of rows in Item Table" value={settings.print.minRowsInTable} onChange={(v) => handleUpdate('print', { minRowsInTable: v })} />
                <ToggleRow label="Total Item Quantity" checked={settings.print.totalItemQuantity} onChange={(v) => handleUpdate('print', { totalItemQuantity: v })} />
                <ToggleRow label="Amount with Decimal (eg 0.00)" checked={settings.print.amountWithDecimal} onChange={(v) => handleUpdate('print', { amountWithDecimal: v })} />
                <ToggleRow label="Received amount" checked={settings.print.receivedAmount} onChange={(v) => handleUpdate('print', { receivedAmount: v })} />
                <ToggleRow label="Balance amount" checked={settings.print.balanceAmount} onChange={(v) => handleUpdate('print', { balanceAmount: v })} />
                <ToggleRow label="Print Current Balance of Party" checked={settings.print.printCurrentBalance} onChange={(v) => handleUpdate('print', { printCurrentBalance: v })} />
                <ToggleRow label="Tax details" checked={settings.print.taxDetails} onChange={(v) => handleUpdate('print', { taxDetails: v })} />
                <ToggleRow label="Amount Grouping" checked={settings.print.amountGrouping} onChange={(v) => handleUpdate('print', { amountGrouping: v })} />
                <SelectRow label="Amount in words format" value={settings.print.amountInWordsFormat} options={['Indian (e.g. 1,00,000)', 'International (e.g. 100,000)']} onChange={(v) => handleUpdate('print', { amountInWordsFormat: v })} />
                <ToggleRow label="You Saved" checked={settings.print.showYouSaved} onChange={(v) => handleUpdate('print', { showYouSaved: v })} />
              </SettingsGroup>

              <SettingsGroup title="Footer">
                <ToggleRow label="Print description" checked={settings.print.printDescription} onChange={(v) => handleUpdate('print', { printDescription: v })} />
                <ToggleRow label="Print Received by details" checked={settings.print.printReceivedBy} onChange={(v) => handleUpdate('print', { printReceivedBy: v })} />
                <ToggleRow label="Print Delivered by details" checked={settings.print.printDeliveredBy} onChange={(v) => handleUpdate('print', { printDeliveredBy: v })} />
                <ToggleRow label="Print Signature Text" checked={settings.print.printSignatureText} onChange={(v) => handleUpdate('print', { printSignatureText: v })} />
                <div className="flex items-center justify-between py-2 cursor-pointer group" onClick={() => {}}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Set Custom Signature Text</span>
                    <Info className="w-4 h-4 text-slate-300" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <ToggleRow label="Payment Mode" checked={settings.print.printPaymentMode} onChange={(v) => handleUpdate('print', { printPaymentMode: v })} />
                <ToggleRow label="Print Acknowledgement" checked={settings.print.printAcknowledgement} onChange={(v) => handleUpdate('print', { printAcknowledgement: v })} />
              </SettingsGroup>

              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 no-print">
                 <button 
                   onClick={() => window.print()}
                   className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-500/20 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                 >
                   <Download className="w-5 h-5" /> Save Preview as PDF
                 </button>
              </div>
            </div>
          </div>
        );

      case 'party':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-8">
            <SettingsGroup title="Loyalty & Rewards Configuration">
              <ToggleRow 
                label="Loyalty Points Tracking" 
                desc="Enable automated rewards for customers" 
                checked={settings.party.loyaltyPoints} 
                onChange={(v) => handleUpdate('party', { loyaltyPoints: v })} 
              />
              {settings.party.loyaltyPoints && (
                 <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 mb-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 mb-4">
                       <Coins className="w-5 h-5 text-blue-600" />
                       <h5 className="text-[10px] font-black uppercase text-blue-800 tracking-widest">Points Allocation Policy</h5>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">₹ Amount spent for 1 Point</label>
                          <input 
                            type="number"
                            className="w-full p-4 bg-white border border-blue-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 100"
                            value={settings.party.loyaltyRate || 100}
                            onChange={(e) => handleUpdate('party', { loyaltyRate: parseFloat(e.target.value) || 0 })}
                          />
                          <p className="text-[8px] font-bold text-blue-500/60 uppercase italic ml-1">Ex: ₹1000 bill will earn 10 points if rate is 100.</p>
                       </div>
                    </div>
                 </div>
              )}
            </SettingsGroup>
            
            <SettingsGroup title="Customer & Vendor Settings">
              <ToggleRow label="Shipping Address" checked={settings.party.shippingAddress} onChange={(v) => handleUpdate('party', { shippingAddress: v })} />
              <ToggleRow label="Payment Reminders" checked={settings.party.paymentReminders} onChange={(v) => handleUpdate('party', { paymentReminders: v })} />
              <StepperRow label="Reminder Offset (Days)" value={settings.party.reminderOffset} onChange={(v) => handleUpdate('party', { reminderOffset: v })} />
            </SettingsGroup>
          </div>
        );

      case 'item':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-8">
            <SettingsGroup title="Inventory Behavior">
              <ToggleRow label="Maintain Inventory" desc="Track stock levels for all products" checked={settings.item.stockMaintenance} onChange={(v) => handleUpdate('item', { stockMaintenance: v })} />
              <ToggleRow label="Serial Number Tracking" checked={settings.item.serialTracking} onChange={(v) => handleUpdate('item', { serialTracking: v })} />
              <ToggleRow label="Batch & Expiry Date" checked={settings.item.batchTracking} onChange={(v) => handleUpdate('item', { batchTracking: v })} />
              <ToggleRow label="Show MRP Column" checked={settings.item.mrpColumn} onChange={(v) => handleUpdate('item', { mrpColumn: v })} />
            </SettingsGroup>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-8">
            <SettingsGroup title="Communication Channels">
              <SelectRow label="Preferred Channel" value={settings.messages.channel} options={['WhatsApp', 'SMS']} onChange={(v) => handleUpdate('messages', { channel: v })} />
              <ToggleRow label="Send copy to self" checked={settings.messages.copyToSelf} onChange={(v) => handleUpdate('messages', { copyToSelf: v })} />
            </SettingsGroup>

            <SettingsGroup title="WhatsApp Template">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">Edit Template</p>
              <textarea 
                rows={4} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                value={settings.messages.template}
                onChange={(e) => handleUpdate('messages', { template: e.target.value })}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                 <TagLabel text="{{CustomerName}}" />
                 <TagLabel text="{{InvoiceAmount}}" />
                 <TagLabel text="{{BikeNumber}}" />
              </div>
            </SettingsGroup>
          </div>
        );

      case 'reminders':
        return (
          <div className="space-y-6 animate-in fade-in duration-300 p-4 md:p-8">
            <SettingsGroup title="Service Reminders Configuration">
              <ToggleRow label="Enable Service Reminders" checked={settings.reminders.enabled} onChange={(v) => handleUpdate('reminders', { enabled: v })} />
              <ToggleRow label="Auto-Schedule on Bill" desc="Automatically calculate next service date after billing" checked={settings.reminders.autoSchedule} onChange={(v) => handleUpdate('reminders', { autoSchedule: v })} />
              <ToggleRow label="Allow Manual Date Selection" desc="Choose specific dates during billing" checked={settings.reminders.manualDateSelection} onChange={(v) => handleUpdate('reminders', { manualDateSelection: v })} />
              <SelectRow label="Default Interval" value={settings.reminders.defaultInterval} options={['15 Days', '1 Month', '3 Months', '6 Months']} onChange={(v) => handleUpdate('reminders', { defaultInterval: v })} />
            </SettingsGroup>

            <SettingsGroup title="Reminder Timing">
              <StepperRow label="Send reminder days before" value={settings.reminders.reminderDaysBefore} onChange={(v) => handleUpdate('reminders', { reminderDaysBefore: v })} />
              <StepperRow label="Messages per day" value={settings.reminders.remindersPerDay} onChange={(v) => handleUpdate('reminders', { remindersPerDay: v })} />
            </SettingsGroup>

            <SettingsGroup title="Reminder Message Template">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">Edit Template</p>
              <textarea 
                rows={4} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Write your reminder message here..."
                value={settings.reminders.reminderTemplate}
                onChange={(e) => handleUpdate('reminders', { reminderTemplate: e.target.value })}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                 <TagLabel text="{{CustomerName}}" />
                 <TagLabel text="{{BikeNumber}}" />
                 <TagLabel text="{{ReminderDate}}" />
                 <TagLabel text="{{ServiceType}}" />
              </div>
            </SettingsGroup>
          </div>
        );

      case 'utilities':
        return (
          <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">
            Module under construction
          </div>
        );

      default:
        return (
          <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">
            Module under construction
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen animate-in fade-in duration-500 overflow-hidden -m-4 md:-m-8">
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-3 left-3 z-[60] no-print">
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
         </button>
      </div>

      {/* Settings Navigation Sidebar */}
      <aside className={`w-full md:w-80 border-r border-slate-100 bg-white flex flex-col absolute inset-0 z-50 md:relative md:translate-x-0 transition-transform no-print ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <SettingsIcon className="w-5 h-5 text-blue-600" /> SETUP
          </h2>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <SettingsNavLink id="reports" icon={<BarChart3 />} label="Reports" active={activeSection === 'reports'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="utilities" icon={<Briefcase />} label="Utilities Hub" active={activeSection === 'utilities'} onClick={() => { onNavigate?.('utilities'); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="general" icon={<Globe />} label="General" active={activeSection === 'general'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="transaction" icon={<FileText />} label="Transaction" active={activeSection === 'transaction'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="transaction_message" icon={<MessageSquareMore />} label="Transaction Message" active={activeSection === 'transaction_message'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="gst" icon={<Percent />} label="GST Settings" active={activeSection === 'gst'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="print" icon={<Printer />} label="Print Design" active={activeSection === 'print'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="party" icon={<Users />} label="Party Settings" active={activeSection === 'party'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="item" icon={<Package />} label="Item Settings" active={activeSection === 'item'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="messages" icon={<MessageSquare />} label="Messages" active={activeSection === 'messages'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
          <SettingsNavLink id="reminders" icon={<Bell />} label="Reminders" active={activeSection === 'reminders'} onClick={(id) => { setActiveSection(id); setIsMobileMenuOpen(false); }} />
        </nav>
        <div className="p-8 bg-slate-50 border-t border-slate-100">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Security</p>
                <p className="text-xs font-bold text-slate-700">AES-256 Cloud Sync</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white md:bg-slate-50 overflow-y-auto w-full pt-16 md:pt-0">
        {renderSection()}
      </main>
    </div>
  );
};

// --- Sub Components ---

const SettingsGroup: React.FC<{ title: string, children: React.ReactNode, showEditIcon?: boolean }> = ({ title, children, showEditIcon }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
    <div className="px-6 py-3 border-b border-slate-50 bg-[#F9FBFF] flex items-center justify-between">
      <h4 className="text-sm font-bold text-slate-600">{title}</h4>
      {showEditIcon && <Edit2 className="w-4 h-4 text-slate-400 cursor-pointer" />}
    </div>
    <div className="p-4 divide-y divide-slate-50">
      {children}
    </div>
  </div>
);

const SettingsNavLink: React.FC<{ id: string, icon: React.ReactNode, label: string, active: boolean, onClick: (id: string) => void }> = ({ id, icon, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50'
    }`}
  >
    <div className="flex items-center gap-3">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 stroke-[2]' })}
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
    {active && <ChevronRight className="w-4 h-4" />}
  </button>
);

const ToggleRow: React.FC<{ 
  label: string, 
  desc?: string, 
  checked: boolean, 
  onChange: (v: boolean) => void,
  isPremium?: boolean,
  showRedDot?: boolean,
  noBorder?: boolean
}> = ({ label, desc, checked, onChange, isPremium, showRedDot, noBorder }) => (
  <div className={`flex items-center justify-between py-5 px-6 bg-white ${noBorder ? '' : 'border-b border-slate-50'}`}>
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <label className="font-medium text-slate-700 text-sm">{label}</label>
        {isPremium && (
          <div className="bg-blue-100 p-1 rounded-md">
            <Crown className="w-3 h-3 text-blue-600" />
          </div>
        )}
        {showRedDot && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
      </div>
      {desc && <p className="text-[10px] text-slate-400 font-medium">{desc}</p>}
    </div>
    <button 
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${checked ? 'bg-blue-600' : 'bg-[#E9E9EA]'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all duration-300 ${checked ? 'left-6.5' : 'left-0.5'}`} />
    </button>
  </div>
);

const SelectRow: React.FC<{ label: string, value: string, options: string[], onChange: (v: any) => void }> = ({ label, value, options, onChange }) => (
  <div className="flex items-center justify-between py-3 px-6">
    <div className="flex items-center gap-2">
      <label className="font-medium text-slate-700 text-sm">{label}</label>
      <Info className="w-4 h-4 text-slate-300" />
    </div>
    <div className="flex items-center gap-1 group cursor-pointer" onClick={() => {}}>
       <select 
         className="bg-transparent text-xs font-medium text-slate-400 outline-none appearance-none cursor-pointer pr-4 text-right"
         value={value}
         onChange={(e) => onChange(e.target.value)}
       >
         {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
       </select>
       <ChevronDownIcon className="w-3.5 h-3.5 text-slate-300 -ml-3 pointer-events-none" />
    </div>
  </div>
);

const StepperRow: React.FC<{ label: string, desc?: string, value: number, onChange: (v: number) => void }> = ({ label, desc, value, onChange }) => (
  <div className="flex items-center justify-between py-3 px-6 bg-white border-b border-slate-50">
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <label className="font-medium text-slate-700 text-sm">{label}</label>
        <Info className="w-4 h-4 text-slate-300" />
      </div>
      {desc && <p className="text-[10px] text-slate-400 font-medium">{desc}</p>}
    </div>
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-1.5 py-1 scale-90">
       <button onClick={() => onChange(Math.max(1, value - 1))} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400"><Minus className="w-3.5 h-3.5" /></button>
       <span className="font-bold text-xs text-slate-500 w-6 text-center">{value.toString().padStart(2, '0')}</span>
       <button onClick={() => onChange(value + 1)} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400"><Plus className="w-3.5 h-3.5" /></button>
    </div>
  </div>
);

const InputRow: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2 py-3 px-6">
    <label className="font-black text-[10px] text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type="text"
      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const ReportCategory: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-2">
    <h3 className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-y border-slate-100">
      {title}
    </h3>
    <div className="bg-white">
      {children}
    </div>
  </div>
);

const ReportItem: React.FC<{ label: string, isPremium?: boolean, onClick: () => void, noBorder?: boolean }> = ({ label, isPremium, onClick, noBorder }) => (
  <button 
    onClick={onClick}
    className={`w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-all text-left ${!noBorder ? 'border-b border-slate-50' : ''}`}
  >
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-slate-700 tracking-tight">{label}</span>
      {isPremium && (
        <div className="bg-purple-100 p-1 rounded-md">
           <Crown className="w-3 h-3 text-purple-600 fill-purple-600" />
        </div>
      )}
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300" />
  </button>
);

const TagLabel: React.FC<{ text: string }> = ({ text }) => (
  <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-blue-100">{text}</span>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default SettingsPage;
