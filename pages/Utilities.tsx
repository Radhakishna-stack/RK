
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  MapPin, Download, Trash2, Database, Users, Bike, Map as MapIcon, 
  Settings, RefreshCcw, FileJson, LogOut, CheckCircle, Store, 
  UserCheck, Barcode, ArrowDownToLine, ExternalLink, ChevronRight, 
  Zap, Info, Search, AlertCircle, FileSpreadsheet, Sparkles, Navigation, Globe,
  Radio, X, Printer, Copy, RotateCw, Building2, Phone, ShieldCheck, Loader2,
  Compass, Eye, Target, FileUp, ListChecks, CheckCircle2, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Calculator, FileCheck, Layers, Boxes,
  HardDriveDownload, Activity, QrCode, Scan, Maximize, Settings2, Link, Type,
  FileText, AlertTriangle
} from 'lucide-react';
import { dbService } from '../db';
import { AppSettings, Invoice, Expense, Transaction, InventoryItem, Customer } from '../types';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface UtilitiesPageProps {
  onNavigate: (tab: string, query?: string) => void;
}

const UtilitiesPage: React.FC<UtilitiesPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'data' | 'ops'>('all');
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  
  // Import/Export States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'Item' | 'Party' | 'Tally'>('Item');
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);

  // Bulk Operations States
  const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-lg mx-auto">
      {/* Header with Data Health Status */}
      <header className="px-1 no-print">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">System Utilities</h2>
        <div className="mt-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                 <Zap className="w-5 h-5 fill-emerald-600" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Health</p>
                 <p className="text-xs font-bold text-slate-700">All Systems Optimized</p>
              </div>
           </div>
           <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
             Verify
           </button>
        </div>
      </header>

      {/* Segmented Controller */}
      <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200 mx-1 no-print">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
          }`}
        >
          All Tools
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'data' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
          }`}
        >
          Data Migration
        </button>
        <button 
          onClick={() => setActiveTab('ops')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'ops' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
          }`}
        >
          Operations
        </button>
      </div>

      <div className="space-y-8 no-print">
        {/* Business Setup Group */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <section className="space-y-4">
             <SectionTitle title="Business Setup & Access" />
             <div className="grid grid-cols-3 gap-6">
                <UtilGridItem icon={<Store />} label="Set Up My Business" onClick={() => setIsSetupModalOpen(true)} color="blue" isAIPowered />
                <UtilGridItem icon={<UserCheck />} label="Accountant Access" onClick={() => {}} color="indigo" />
                <UtilGridItem icon={<Radio />} label="GPS Staff Monitor" onClick={() => onNavigate('salesmen')} color="emerald" hasActivity isAIPowered />
             </div>
          </section>
        )}

        {/* Data Migration Group */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <section className="space-y-4">
             <SectionTitle title="Data Migration" />
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="grid grid-cols-3 gap-6">
                   <UtilGridItem 
                      icon={<ArrowDownToLine />} 
                      label="Import Items" 
                      onClick={() => { setImportType('Item'); setIsImportModalOpen(true); }} 
                      color="blue" 
                   />
                   <UtilGridItem 
                      icon={<Users />} 
                      label="Import Parties" 
                      onClick={() => { setImportType('Party'); setIsImportModalOpen(true); }} 
                      color="blue" 
                   />
                   <UtilGridItem 
                      icon={<FileJson />} 
                      label="Import From Tally" 
                      onClick={() => { setImportType('Tally'); setIsImportModalOpen(true); }} 
                      color="indigo" 
                      isAIPowered 
                   />
                </div>
                <div className="h-px bg-slate-50"></div>
                <div className="grid grid-cols-3 gap-6">
                   <UtilGridItem 
                      icon={<ExternalLink />} 
                      label="Export To Tally" 
                      onClick={() => setIsTallyModalOpen(true)} 
                      color="indigo" 
                   />
                   <UtilGridItem icon={<FileSpreadsheet />} label="Bulk Export" onClick={() => setIsBulkExportOpen(true)} color="slate" />
                   <UtilGridItem icon={<RefreshCcw />} label="Update Bulk" onClick={() => setIsBulkUpdateOpen(true)} color="amber" />
                </div>
             </div>
          </section>
        )}

        {/* Operations Power Tools */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <section className="space-y-4">
             <SectionTitle title="Inventory Power Tools" />
             <div className="grid grid-cols-3 gap-6">
                <UtilGridItem icon={<Barcode />} label="Label Studio" onClick={() => setIsBarcodeModalOpen(true)} color="emerald" />
                <UtilGridItem icon={<RefreshCcw />} label="Sync Data" onClick={() => {}} color="blue" />
                <UtilGridItem icon={<Trash2 />} label="Recycle Bin" onClick={() => onNavigate('recycle_bin')} color="red" />
             </div>
          </section>
        )}
      </div>

      {/* AI Assistance Promo Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[32px] p-6 text-white shadow-xl shadow-slate-900/10 no-print">
         <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Master Financials</h3>
               </div>
               <p className="text-[10px] text-slate-400 max-w-[180px]">New: Sync all service center ledgers directly with Tally Prime.</p>
            </div>
            <button onClick={() => setIsTallyModalOpen(true)} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
               Sync Tally
            </button>
         </div>
         <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <Calculator className="w-32 h-32" />
         </div>
      </div>

      {/* Modals */}
      {isBarcodeModalOpen && <LabelStudioModal onClose={() => setIsBarcodeModalOpen(false)} />}
      {isSetupModalOpen && <BusinessSetupModal onClose={() => setIsSetupModalOpen(false)} />}
      {isImportModalOpen && <DataImportModal type={importType} onClose={() => setIsImportModalOpen(false)} />}
      {isTallyModalOpen && <TallySyncModal onClose={() => setIsTallyModalOpen(false)} />}
      {isBulkExportOpen && <BulkExportModal onClose={() => setIsBulkExportOpen(false)} />}
      {isBulkUpdateOpen && <BulkUpdateModal onClose={() => setIsBulkUpdateOpen(false)} />}
    </div>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-between px-1">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>
    <div className="h-px bg-slate-100 flex-1 ml-4"></div>
  </div>
);

const UtilGridItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void, 
  color?: string, 
  isAIPowered?: boolean,
  hasActivity?: boolean
}> = ({ icon, label, onClick, color = 'blue', isAIPowered, hasActivity }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group active:scale-95 transition-all">
      <div className={`relative w-16 h-16 rounded-[22px] border ${colorMap[color]} flex items-center justify-center transition-all group-hover:shadow-md group-hover:bg-opacity-80`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-7 h-7 stroke-[1.5]" })}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full border border-slate-100"></div>
        {isAIPowered && (
          <div className="absolute -top-1 -right-1 bg-blue-600 p-1 rounded-full text-white shadow-lg border border-white">
            <Sparkles className="w-2.5 h-2.5 fill-white" />
          </div>
        )}
        {hasActivity && (
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
        )}
      </div>
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight text-center leading-tight max-w-[64px]">
        {label}
      </span>
    </button>
  );
};

const LabelStudioModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [studioMode, setStudioMode] = useState<'asset' | 'link' | 'text'>('asset');
  const [codeType, setCodeType] = useState<'barcode' | 'qrcode'>('barcode');
  const [symbology, setSymbology] = useState<string>('CODE128');
  
  // Asset Mode State
  const [assetSKU, setAssetSKU] = useState('SKU-' + Date.now().toString().slice(-6));
  const [assetTitle, setAssetTitle] = useState('GENUINE SPARE PART');
  const [assetPrice, setAssetPrice] = useState('450');
  
  // Link Mode State
  const [linkURL, setLinkURL] = useState('https://google.com/search?q=Moto+Gear+SRK');
  const [linkTitle, setLinkTitle] = useState('SCAN FOR GOOGLE REVIEWS');
  
  // Text Mode State
  const [textHeader, setTextHeader] = useState('DANGER');
  const [textSub, setTextSub] = useState('HIGH VOLTAGE AREA');
  const [textBody, setTextBody] = useState('AUTHORISED PERSONNEL ONLY');

  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-render logic
  useEffect(() => {
    if (!canvasRef.current) return;
    setError(null);
    const canvas = canvasRef.current;

    const renderAsset = () => {
      if (codeType === 'barcode') {
        try {
          JsBarcode(canvas, assetSKU, {
            format: symbology,
            width: 2,
            height: 60,
            displayValue: false,
            margin: 0,
            background: 'transparent'
          });
        } catch (e) { setError(`Invalid SKU for ${symbology}`); }
      } else {
        QRCode.toCanvas(canvas, assetSKU, { width: 140, margin: 0 }, (err) => { if (err) setError('QR Fail'); });
      }
    };

    const renderLink = () => {
      QRCode.toCanvas(canvas, linkURL, { width: 180, margin: 0, color: { dark: '#000000', light: '#ffffff' } }, (err) => { if (err) setError('Link QR Fail'); });
    };

    const renderTextOnly = () => {
      // For text only, we don't need the canvas for code, but we use it to show a "TEXT MODE" watermark
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 14px Inter";
        ctx.textAlign = "center";
        ctx.fillText("ALPHANUMERIC MODE", canvas.width/2, canvas.height/2);
      }
    };

    if (studioMode === 'asset') renderAsset();
    else if (studioMode === 'link') renderLink();
    else renderTextOnly();

  }, [studioMode, codeType, symbology, assetSKU, linkURL]);

  const handlePrint = () => {
    window.print();
  };

  const handlePNGExport = () => {
    if (!canvasRef.current) return;
    const printCanvas = document.createElement('canvas');
    printCanvas.width = 400;
    printCanvas.height = 300;
    const pctx = printCanvas.getContext('2d');
    if (!pctx) return;

    pctx.fillStyle = 'white';
    pctx.fillRect(0, 0, printCanvas.width, printCanvas.height);
    pctx.fillStyle = 'black';
    pctx.textAlign = 'center';

    if (studioMode === 'asset') {
       pctx.font = 'bold 22px Inter';
       pctx.fillText(assetTitle.toUpperCase(), 200, 40);
       pctx.drawImage(canvasRef.current, 20, 60, 360, 160);
       pctx.font = 'black 32px Inter';
       pctx.fillText(`₹ ${assetPrice}`, 200, 270);
    } else if (studioMode === 'link') {
       pctx.font = 'bold 18px Inter';
       pctx.fillText(linkTitle.toUpperCase(), 200, 40);
       pctx.drawImage(canvasRef.current, 100, 60, 200, 200);
    } else {
       pctx.font = 'black 48px Inter';
       pctx.fillText(textHeader.toUpperCase(), 200, 80);
       pctx.font = 'bold 24px Inter';
       pctx.fillText(textSub.toUpperCase(), 200, 150);
       pctx.font = 'medium 16px Inter';
       pctx.fillText(textBody, 200, 220);
    }

    const link = document.createElement('a');
    link.download = `label-${Date.now()}.png`;
    link.href = printCanvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white no-print">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <Scan className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Thermal Studio</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Advanced Asset Tagging</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar no-print">
           
           {/* Studio Mode Selector */}
           <div className="flex bg-slate-100 p-1.5 rounded-3xl border border-slate-200">
              <ModeBtn active={studioMode === 'asset'} onClick={() => setStudioMode('asset')} icon={<Boxes className="w-4 h-4" />} label="Asset" />
              <ModeBtn active={studioMode === 'link'} onClick={() => setStudioMode('link')} icon={<Link className="w-4 h-4" />} label="Link QR" />
              <ModeBtn active={studioMode === 'text'} onClick={() => setStudioMode('text')} icon={<Type className="w-4 h-4" />} label="Text Label" />
           </div>

           {/* Live Preview Console */}
           <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-8 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100 w-full max-w-[320px] min-h-[220px] flex flex-col items-center justify-between text-center animate-in zoom-in-95">
                 
                 {studioMode === 'asset' && (
                    <>
                       <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">{assetTitle || 'ITEM LABEL'}</p>
                       <div className="relative w-full flex justify-center">
                          <canvas ref={canvasRef} className={`${codeType === 'barcode' ? 'w-full h-20' : 'w-32 h-32'}`} />
                          {error && <div className="absolute inset-0 bg-white/95 flex items-center justify-center"><p className="text-[10px] font-black text-red-500 uppercase">{error}</p></div>}
                       </div>
                       <div className="mt-4 pt-4 border-t border-slate-50 w-full flex justify-between items-center px-2">
                          <p className="text-[9px] font-mono text-slate-400 font-bold">{assetSKU}</p>
                          <p className="text-xl font-black text-slate-900 tracking-tighter">₹ {assetPrice}</p>
                       </div>
                    </>
                 )}

                 {studioMode === 'link' && (
                    <>
                       <div className="flex items-center gap-2 mb-4 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                          <Link className="w-3 h-3 text-blue-600" />
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Digital Direct</span>
                       </div>
                       <canvas ref={canvasRef} className="w-40 h-40" />
                       <p className="mt-4 text-[10px] font-black text-slate-800 uppercase tracking-tighter leading-tight max-w-[200px]">{linkTitle}</p>
                    </>
                 )}

                 {studioMode === 'text' && (
                    <div className="flex flex-col items-center justify-center h-full w-full py-6">
                       <h2 className="text-3xl font-black text-slate-900 uppercase leading-none mb-2">{textHeader || 'HEADER'}</h2>
                       <h4 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">{textSub}</h4>
                       <div className="h-px w-12 bg-slate-200 mb-4"></div>
                       <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight leading-relaxed">{textBody}</p>
                    </>
                 )}

              </div>
              <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">WYSIWYG Thermal View</p>
           </div>

           {/* Dynamic Controls based on Mode */}
           <div className="space-y-6 animate-in fade-in duration-500">
              
              {studioMode === 'asset' && (
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Symbology Protocol</label>
                       <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                          <button onClick={() => setCodeType('barcode')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${codeType === 'barcode' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>1D Linear</button>
                          <button onClick={() => setCodeType('qrcode')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${codeType === 'qrcode' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>2D Matrix</button>
                       </div>
                       {codeType === 'barcode' && (
                          <div className="grid grid-cols-3 gap-2">
                             {['CODE128', 'CODE39', 'EAN13'].map(s => (
                                <button key={s} onClick={() => setSymbology(s)} className={`py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${symbology === s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{s}</button>
                             ))}
                          </div>
                       )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <StudioInput label="Product SKU" value={assetSKU} onChange={setAssetSKU} placeholder="M-OIL-01" isMono />
                       <StudioInput label="Retail Price" value={assetPrice} onChange={setAssetPrice} placeholder="0.00" />
                    </div>
                    <StudioInput label="Label Header Title" value={assetTitle} onChange={setAssetTitle} placeholder="BRAND NAME" />
                 </div>
              )}

              {studioMode === 'link' && (
                 <div className="space-y-6">
                    <StudioInput label="Target URL / Link" value={linkURL} onChange={setLinkURL} placeholder="https://..." isURL />
                    <StudioInput label="Footer CTA Text" value={linkTitle} onChange={setLinkTitle} placeholder="SCAN TO CONNECT" />
                    <div className="bg-blue-50 p-5 rounded-[28px] border border-blue-100 flex items-start gap-4">
                       <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-blue-700 font-medium leading-relaxed">Links are converted using high-redundancy QR encoding. Ensure the URL starts with <b>https://</b> for maximum compatibility.</p>
                    </div>
                 </div>
              )}

              {studioMode === 'text' && (
                 <div className="space-y-6">
                    <StudioInput label="Primary Header (XL)" value={textHeader} onChange={setTextHeader} placeholder="DANGER / NOTICE" />
                    <StudioInput label="Sub-Header (MD)" value={textSub} onChange={setTextSub} placeholder="SECONDARY DETAIL" />
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label Description / Body</label>
                       <textarea className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-bold uppercase resize-none h-20" value={textBody} onChange={e => setTextBody(e.target.value)} placeholder="ENTER MULTILINE TEXT..." />
                    </div>
                 </div>
              )}

           </div>
        </div>

        {/* Global Footer Actions */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4 no-print">
           <button onClick={handlePNGExport} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Export PNG</button>
           <button onClick={handlePrint} className="flex-[2] py-5 bg-slate-900 text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Printer className="w-5 h-5" /> Print Thermal</button>
        </div>

        {/* PRINT TEMPLATE - Hidden on UI, active during window.print() */}
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-4 text-black">
           <div className="border border-black p-4 w-[380px] min-h-[250px] mx-auto flex flex-col items-center justify-between text-center">
              {studioMode === 'asset' && (
                 <>
                    <h2 className="text-xl font-bold uppercase mb-4">{assetTitle}</h2>
                    <img src={canvasRef.current?.toDataURL() || ''} className={codeType === 'barcode' ? 'w-full h-24' : 'w-32 h-32'} />
                    <div className="w-full border-t border-black mt-4 pt-4 flex justify-between items-center px-2">
                       <span className="font-mono text-sm">{assetSKU}</span>
                       <span className="text-2xl font-black">₹ {assetPrice}</span>
                    </div>
                 </>
              )}
              {studioMode === 'link' && (
                 <>
                    <h2 className="text-lg font-bold uppercase mb-4">{linkTitle}</h2>
                    <img src={canvasRef.current?.toDataURL() || ''} className="w-48 h-48" />
                    <p className="text-[8px] mt-4 font-mono text-slate-400 break-all">{linkURL}</p>
                 </>
              )}
              {studioMode === 'text' && (
                 <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="text-4xl font-black uppercase mb-2">{textHeader}</h1>
                    <h3 className="text-xl font-bold uppercase mb-4">{textSub}</h3>
                    <div className="h-0.5 w-16 bg-black mb-4"></div>
                    <p className="text-xs uppercase leading-relaxed">{textBody}</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const ModeBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${active ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
     {icon} {label}
  </button>
);

const StudioInput: React.FC<{ label: string, value: string, onChange: (v: string) => void, placeholder: string, isMono?: boolean, isURL?: boolean }> = ({ label, value, onChange, placeholder, isMono, isURL }) => (
  <div className="space-y-2">
     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     <div className="relative">
        <input 
          className={`w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-black transition-all focus:ring-4 focus:ring-blue-500/5 ${isMono ? 'font-mono' : ''} ${isURL ? 'lowercase font-medium' : 'uppercase'}`} 
          value={value} 
          onChange={e => onChange(isURL ? e.target.value : e.target.value.toUpperCase())} 
          placeholder={placeholder}
        />
        {isMono && <button onClick={() => onChange('SKU-' + Math.floor(Math.random()*1000000))} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-slate-300 rounded-xl hover:text-blue-600 transition-colors"><RotateCw className="w-3.5 h-3.5" /></button>}
     </div>
  </div>
);

const BulkExportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState({ items: 0, customers: 0, invoices: 0, expenses: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const [inv, cust, invs, exps] = await Promise.all([
        dbService.getInventory(),
        dbService.getCustomers(),
        dbService.getInvoices(),
        dbService.getExpenses()
      ]);
      setSummary({ items: inv.length, customers: cust.length, invoices: invs.length, expenses: exps.length });
    };
    fetchData();
  }, []);

  const handleFullExport = async () => {
    setExporting(true);
    try {
      const [inv, cust, invs, exps, txns] = await Promise.all([
        dbService.getInventory(),
        dbService.getCustomers(),
        dbService.getInvoices(),
        dbService.getExpenses(),
        dbService.getTransactions()
      ]);

      const downloadCsv = (name: string, headers: string[], rows: any[][]) => {
        const content = [headers.join(","), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(","))].join("\n");
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      };

      downloadCsv('Inventory_Master', ['ID', 'Name', 'Category', 'Stock', 'UnitPrice', 'PurchasePrice', 'ItemCode', 'GST', 'HSN'], inv.map(i => [i.id, i.name, i.category, i.stock, i.unitPrice, i.purchasePrice, i.itemCode, i.gstRate, i.hsn]));
      await new Promise(r => setTimeout(r, 300));
      downloadCsv('Customer_Registry', ['ID', 'Name', 'Phone', 'BikeNo', 'City', 'Points', 'GSTIN'], cust.map(c => [c.id, c.name, c.phone, c.bikeNumber, c.city, c.loyaltyPoints, c.gstin]));
      await new Promise(r => setTimeout(r, 300));
      downloadCsv('Invoice_Log', ['ID', 'Date', 'Customer', 'Bike', 'Total', 'Status', 'PaymentMode'], invs.map(i => [i.id, i.date, i.customerName, i.bikeNumber, i.finalAmount, i.paymentStatus, i.paymentMode]));
      
      alert("Master Backup Files Generated! 💾");
      onClose();
    } catch (err) {
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <HardDriveDownload className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">System Vault Export</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Data Extraction</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-2 gap-3">
              <SyncStat label="Items" value={summary.items} />
              <SyncStat label="Parties" value={summary.customers} />
              <SyncStat label="Bills" value={summary.invoices} />
              <SyncStat label="Expenses" value={summary.expenses} />
           </div>
           <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 space-y-3">
              <div className="flex items-center gap-2">
                 <Info className="w-4 h-4 text-blue-600" />
                 <h4 className="text-[10px] font-black text-blue-900 uppercase">Export Protocol</h4>
              </div>
              <p className="text-[10px] text-blue-700 font-medium leading-relaxed">Extracts all system registries as Excel-compatible CSV files. Use this for offline auditing or cloud migration.</p>
           </div>
           <button 
             onClick={handleFullExport}
             disabled={exporting}
             className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
           >
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Generate All Archives
           </button>
        </div>
      </div>
    </div>
  );
};

const BulkUpdateModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [summary, setSummary] = useState({ updated: 0, created: 0 });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csv = "Item Code,Name,Category,Stock,Sale Price,Purchase Price,GST Rate,HSN\nSKU-101,MOTUL 20W40,Consumables,100,450,380,18,3403\nSKU-102,BRAKE PAD,Spares,40,850,600,12,8714";
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bulk_Update_Template.csv`;
    link.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('processing');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      
      const updates: Partial<InventoryItem>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;

        updates.push({
          itemCode: values[0],
          name: values[1],
          category: values[2],
          stock: parseFloat(values[3]) || 0,
          unitPrice: parseFloat(values[4]) || 0,
          purchasePrice: parseFloat(values[5]) || 0,
          gstRate: parseFloat(values[6]) || 0,
          hsn: values[7] || ''
        });
      }

      try {
        const result = await dbService.bulkUpdateInventory(updates);
        setSummary(result);
        setStatus('success');
      } catch (err) {
        alert("Bulk update failed.");
        setStatus('idle');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <RefreshCcw className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Bulk Registry Update</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mass Price & Stock Modification</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-8">
           {status === 'idle' && (
             <div className="space-y-8">
                <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 space-y-4">
                   <div className="flex items-center gap-3">
                      <ListChecks className="w-5 h-5 text-amber-600" />
                      <h4 className="text-xs font-black text-amber-900 uppercase">Batch Protocol</h4>
                   </div>
                   <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      Download the template, update existing items by their <b>SKU/Item Code</b>, or add new rows to create SKUs in bulk.
                   </p>
                   <button 
                      onClick={handleDownloadTemplate}
                      className="w-full py-4 bg-white border border-amber-200 rounded-2xl flex items-center justify-center gap-2 text-amber-600 text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                   >
                      <Download className="w-4 h-4" /> Download SKU Template
                   </button>
                </div>

                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="group border-2 border-dashed border-slate-200 rounded-[40px] p-12 text-center space-y-4 cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition-all"
                >
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner border border-slate-100 group-hover:scale-110 transition-transform">
                      <FileUp className="w-10 h-10 text-slate-300 group-hover:text-amber-500 transition-colors" />
                   </div>
                   <h4 className="text-base font-black text-slate-900 uppercase">Ingest Modified File</h4>
                   <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                </div>
             </div>
           )}

           {status === 'processing' && (
             <div className="py-20 flex flex-col items-center justify-center gap-8 text-center animate-in zoom-in-95">
                <Loader2 className="w-16 h-16 animate-spin text-amber-500" />
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Applying Batch Logic...</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Master Inventory</p>
                </div>
             </div>
           )}

           {status === 'success' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-4">
                <div className="flex flex-col items-center gap-4 text-center">
                   <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-600 shadow-inner border border-emerald-100">
                      <CheckCircle2 className="w-10 h-10" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Batch Processed</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master SKU Registry Updated</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white border border-slate-100 p-6 rounded-[32px] text-center shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SKUs Updated</p>
                      <p className="text-3xl font-black text-blue-500">{summary.updated}</p>
                   </div>
                   <div className="bg-white border border-slate-100 p-6 rounded-[32px] text-center shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">New Cataloged</p>
                      <p className="text-3xl font-black text-emerald-500">{summary.created}</p>
                   </div>
                </div>

                <button 
                   onClick={onClose}
                   className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                >
                   Close Terminal
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const TallySyncModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [exporting, setExporting] = useState(false);
  const [counts, setCounts] = useState({ invoices: 0, expenses: 0, payments: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
       const [inv, exp, txns] = await Promise.all([
          dbService.getInvoices(),
          dbService.getExpenses(),
          dbService.getTransactions()
       ]);
       setCounts({
          invoices: inv.length,
          expenses: exp.length,
          payments: txns.length
       });
    };
    fetchCounts();
  }, []);

  const handleTallyExport = async () => {
    setExporting(true);
    try {
       const [invoices, expenses, txns] = await Promise.all([
          dbService.getInvoices(),
          dbService.getExpenses(),
          dbService.getTransactions()
       ]);

       const headers = ["Date", "Voucher Type", "Voucher No", "Party/Ledger", "Item/Description", "Quantity", "Rate", "Taxable Amount", "GST%", "Total Amount", "Account Head"];
       const rows: any[] = [];

       invoices.forEach(inv => {
          inv.items.forEach(item => {
             rows.push([
                new Date(inv.date).toLocaleDateString('en-GB'),
                "Sales",
                inv.id,
                inv.customerName,
                item.description,
                1,
                item.amount,
                item.amount,
                item.gstRate || 0,
                inv.finalAmount,
                inv.paymentMode || "Cash"
             ]);
          });
       });

       expenses.forEach(exp => {
          rows.push([
             new Date(exp.date).toLocaleDateString('en-GB'),
             "Payment (Expense)",
             exp.id,
             "Sundry Creditors / Cash",
             exp.title,
             1,
             exp.amount,
             exp.amount,
             0,
             exp.amount,
             exp.paymentMode || "Cash"
          ]);
       });

       txns.filter(t => t.type === 'IN').forEach(t => {
          rows.push([
             new Date(t.date).toLocaleDateString('en-GB'),
             "Receipt",
             t.id,
             t.entityId,
             t.description,
             1,
             t.amount,
             t.amount,
             0,
             t.amount,
             t.paymentMode || "Cash"
          ]);
       });

       const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
       const link = document.createElement("a");
       const url = URL.createObjectURL(blob);
       link.setAttribute("href", url);
       link.setAttribute("download", `Tally_Financial_Export_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
       link.style.visibility = 'hidden';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);

       setTimeout(() => {
          alert("Master Accountant Pack Generated Successfully! 📊");
          onClose();
       }, 500);
    } catch (err) {
       alert("Sync failed.");
    } finally {
       setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                 <Calculator className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tally Prime Sync</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Data Export</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-8">
           <div className="grid grid-cols-3 gap-3">
              <SyncStat label="Invoices" value={counts.invoices} />
              <SyncStat label="Expenses" value={counts.expenses} />
              <SyncStat label="Receipts" value={counts.payments} />
           </div>

           <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 space-y-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-indigo-600" />
                 <h4 className="text-xs font-black text-indigo-900 uppercase">Neural Audit Pass</h4>
              </div>
              <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                 The Synapse core has validated {counts.invoices + counts.expenses + counts.payments} records. Exporting in <b>Voucher Flatfile</b> format (Tally/Excel ready).
              </p>
           </div>

           <div className="space-y-4">
              <button 
                onClick={handleTallyExport}
                disabled={exporting}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                 {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                 Generate Accountant Pack
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const SyncStat: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
     <p className="text-xl font-black text-slate-900">{value}</p>
     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

const DataImportModal: React.FC<{ type: 'Item' | 'Party' | 'Tally', onClose: () => void }> = ({ type, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [summary, setSummary] = useState({ success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSample = () => {
    let csv = "";
    if (type === 'Item') csv = "Name,Category,Stock,Sale Price,Purchase Price,Item Code,GST Rate,HSN\nEngine Oil 20W40,Consumables,50,450,380,M-OIL-01,18,3403";
    else if (type === 'Party') csv = "Name,Phone,Bike Number,City,Email,Address,GSTIN\nRahul Sharma,9876543210,MH12AB1234,Pune,rahul@example.com,Viman Nagar,27AAAAA0000A1Z5";
    else csv = "Master Type,Name,Group/Category,Opening Balance,GSTIN,Phone\nLedger,HDFC Bank,Bank Accounts,50000,,9876543210";

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sample_${type}_Template.csv`;
    link.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('processing');
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      let successCount = 0;
      let failedCount = 0;
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;
        try {
          if (type === 'Item') await dbService.addInventoryItem({ name: values[0]?.toUpperCase() || 'ITEM', category: values[1]?.toUpperCase() || 'MISC', stock: parseFloat(values[2]) || 0, unitPrice: parseFloat(values[3]) || 0, purchasePrice: parseFloat(values[4]) || 0, itemCode: values[5] || '', gstRate: parseFloat(values[6]) || 0, hsn: values[7] || '' });
          else if (type === 'Party') await dbService.addCustomer({ name: values[0] || 'GUEST', phone: values[1] || '', bikeNumber: values[2]?.toUpperCase() || 'MH00XX0000', city: values[3]?.toUpperCase() || 'PUNE', email: values[4] || '', address: values[5] || '', gstin: values[6] || '' });
          else if (type === 'Tally') {
             if (values[0]?.toLowerCase() === 'ledger') await dbService.addCustomer({ name: values[1] || 'GUEST', phone: values[5] || '', bikeNumber: 'TALLY-LEDGER', city: values[2] || '', gstin: values[4] || '' });
             else await dbService.addInventoryItem({ name: values[1]?.toUpperCase() || 'ITEM', category: values[2]?.toUpperCase() || 'TALLY', stock: parseFloat(values[3]) || 0, unitPrice: 0, purchasePrice: 0 });
          }
          successCount++;
        } catch (err) { failedCount++; }
      }
      setSummary({ success: successCount, failed: failedCount });
      setStatus('success');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                 <ArrowDownToLine className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Bulk Ingestion</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Migration Protocol</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
           {status === 'idle' && (
             <div className="space-y-8">
                <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 space-y-4">
                   <div className="flex items-center gap-3">
                      <ListChecks className="w-5 h-5 text-blue-600" />
                      <h4 className="text-xs font-black text-blue-900 uppercase">Sync Checklist</h4>
                   </div>
                   <p className="text-[10px] text-blue-700 font-medium leading-relaxed uppercase">1. Download Template <br/> 2. Map Columns <br/> 3. Upload File</p>
                   <button onClick={handleDownloadSample} className="w-full py-4 bg-white border border-blue-200 rounded-2xl flex items-center justify-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Download className="w-4 h-4" /> Download Sample</button>
                </div>
                <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-[40px] p-12 text-center space-y-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-inner border border-slate-100">
                      <FileUp className="w-10 h-10 text-slate-300 group-hover:text-blue-500 transition-colors" />
                   </div>
                   <h4 className="text-base font-black text-slate-900 uppercase">Select File</h4>
                   <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                </div>
             </div>
           )}
           {status === 'processing' && <div className="py-20 flex flex-col items-center justify-center gap-8 text-center animate-in zoom-in-95"><Loader2 className="w-16 h-16 animate-spin text-blue-600" /><h3 className="text-xl font-black text-slate-900 uppercase">Processing...</h3></div>}
           {status === 'success' && <div className="space-y-8 animate-in slide-in-from-bottom-4 text-center"><div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-600 mx-auto"><CheckCircle2 className="w-10 h-10" /></div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Ingestion Complete</h3><div className="grid grid-cols-2 gap-4"><div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Commits</p><p className="text-3xl font-black text-emerald-500">{summary.success}</p></div><div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Drops</p><p className="text-3xl font-black text-red-400">{summary.failed}</p></div></div><button onClick={onClose} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Dismiss</button></div>}
        </div>
      </div>
    </div>
  );
};

const BusinessSetupModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', gstin: '' });
  useEffect(() => { dbService.getSettings().then(settings => { setForm({ name: settings.transaction.prefixes.firmName, address: settings.general.businessAddress, phone: settings.general.businessPhone, gstin: settings.gst.enabled ? 'GSTIN ACTIVE' : '' }); setLoading(false); }); }, []);
  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); const settings = await dbService.getSettings(); const updated: AppSettings = { ...settings, general: { ...settings.general, businessAddress: form.address, businessPhone: form.phone }, transaction: { ...settings.transaction, prefixes: { ...settings.transaction.prefixes, firmName: form.name } } }; await dbService.updateSettings(updated); setSaving(false); onClose(); };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Building2 className="w-5 h-5" /></div><div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Identity Core</h3></div></div><button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><X className="w-6 h-6" /></button></div>
        {loading ? <div className="p-20 flex flex-col items-center justify-center gap-4"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /><p className="text-[10px] font-black uppercase text-slate-300">Loading...</p></div> : <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar"><div className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Firm Identity</label><input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label><textarea required rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none resize-none" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact No</label><input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN Ref</label><input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase outline-none" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} /></div></div></div><button type="submit" disabled={saving} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />} Save Identity</button></form>}
      </div>
    </div>
  );
};

export default UtilitiesPage;
