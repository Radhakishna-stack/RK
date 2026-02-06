import React, { useState } from 'react';
import { Download, Upload, QrCode, Barcode, FileText, Database, RefreshCw, Share2, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCodeLib from 'qrcode';
import { dbService } from '../db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

const UtilitiesPage: React.FC = () => {
   const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
   const [labelText, setLabelText] = useState('');
   const [labelType, setLabelType] = useState<'qr' | 'barcode'>('qr');
   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
   const [importType, setImportType] = useState<'customers' | 'inventory'>('customers');
   const [importFile, setImportFile] = useState<File | null>(null);
   const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
   const [validationErrors, setValidationErrors] = useState<string[]>([]);
   const [isExporting, setIsExporting] = useState(false);

   const generateLabel = async () => {
      if (!labelText.trim()) {
         alert('Please enter text for the label');
         return;
      }

      try {
         const canvas = document.createElement('canvas');

         if (labelType === 'qr') {
            await QRCodeLib.toCanvas(canvas, labelText, { width: 300 });
         } else {
            JsBarcode(canvas, labelText, {
               format: "CODE128",
               width: 2,
               height: 100
            });
         }

         // Download
         const link = document.createElement('a');
         link.download = `${labelType}-${Date.now()}.png`;
         link.href = canvas.toDataURL();
         link.click();

         alert(`${labelType === 'qr' ? 'QR Code' : 'Barcode'} generated successfully!`);
         setIsLabelModalOpen(false);
         setLabelText('');
      } catch (err) {
         alert('Failed to generate label. Please try again.');
      }
   };

   const exportToTallyXML = async () => {
      setIsExporting(true);
      try {
         const xml = await dbService.exportToTallyXML();
         const blob = new Blob([xml], { type: 'application/xml' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `tally-export-${Date.now()}.xml`;
         link.click();
         URL.revokeObjectURL(url);
         alert('Tally XML exported successfully!');
      } catch (err) {
         alert('Failed to export Tally XML. Please try again.');
      } finally {
         setIsExporting(false);
      }
   };

   const exportToTallyCSV = async () => {
      setIsExporting(true);
      try {
         const csvData = await dbService.exportToTallyCSV();

         // Create separate CSV files for each entity
         Object.entries(csvData).forEach(([key, csv]) => {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tally-${key}-${Date.now()}.csv`;
            link.click();
            URL.revokeObjectURL(url);
         });

         alert('Tally CSV files exported successfully!');
      } catch (err) {
         alert('Failed to export Tally CSV. Please try again.');
      } finally {
         setIsExporting(false);
      }
   };

   const exportAllData = async () => {
      setIsExporting(true);
      try {
         const csv = await dbService.exportAllDataToExcel();
         const blob = new Blob([csv], { type: 'text/csv' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `moto-gear-complete-export-${Date.now()}.csv`;
         link.click();
         URL.revokeObjectURL(url);
         alert('Complete data exported successfully!');
      } catch (err) {
         alert('Failed to export data. Please try again.');
      } finally {
         setIsExporting(false);
      }
   };

   const downloadTemplate = (type: 'customers' | 'inventory' | 'invoices') => {
      const templates = dbService.getImportTemplates();
      const csv = templates[type];
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-template.csv`;
      link.click();
      URL.revokeObjectURL(url);
   };

   const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setImportFile(file);
         setImportStatus(null);
         setValidationErrors([]);
      }
   };

   const processImport = async () => {
      if (!importFile) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
         try {
            const csvData = event.target?.result as string;
            const validation = await dbService.validateCSVImport(csvData, importType);

            if (!validation.valid) {
               setValidationErrors(validation.errors);
               setImportStatus({ type: 'error', message: `Validation failed: ${validation.errors.length} error(s) found` });
               return;
            }

            // Import validated data
            if (importType === 'customers') {
               const result = await dbService.bulkImportCustomers(validation.data);
               setImportStatus({
                  type: 'success',
                  message: `Successfully imported ${result.imported} customer(s). ${result.skipped} skipped (duplicates).`
               });
            } else if (importType === 'inventory') {
               const result = await dbService.bulkUpdateInventory(validation.data);
               setImportStatus({
                  type: 'success',
                  message: `Successfully processed ${result.updated + result.created} item(s). ${result.updated} updated, ${result.created} created.`
               });
            }

            setImportFile(null);
            setValidationErrors([]);

            // Close modal after 2 seconds
            setTimeout(() => {
               setIsImportModalOpen(false);
               setImportStatus(null);
            }, 2000);
         } catch (err) {
            setImportStatus({ type: 'error', message: 'Failed to process import. Please check file format.' });
         }
      };
      reader.readAsText(importFile);
   };

   const exportData = async () => {
      try {
         const [customers, jobs, inventory, invoices] = await Promise.all([
            dbService.getCustomers(),
            dbService.getComplaints(),
            dbService.getInventory(),
            dbService.getInvoices()
         ]);

         const data = {
            exportDate: new Date().toISOString(),
            customers,
            jobs,
            inventory,
            invoices
         };

         const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.download = `moto-gear-backup-${Date.now()}.json`;
         link.click();
         URL.revokeObjectURL(url);

         alert('Data exported successfully!');
      } catch (err) {
         alert('Failed to export data. Please try again.');
      }
   };

   const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
         try {
            const data = JSON.parse(event.target?.result as string);

            if (window.confirm('This will replace existing data. Continue?')) {
               // Import logic would go here
               alert('Data import feature coming soon!');
            }
         } catch (err) {
            alert('Invalid file format. Please upload a valid backup file.');
         }
      };
      reader.readAsText(file);
   };

   const utilities = [
      {
         icon: QrCode,
         label: 'Generate QR Code',
         description: 'Create QR codes for bikes',
         color: 'bg-blue-100 text-blue-600',
         action: () => {
            setLabelType('qr');
            setIsLabelModalOpen(true);
         }
      },
      {
         icon: Barcode,
         label: 'Generate Barcode',
         description: 'Create barcodes for items',
         color: 'bg-green-100 text-green-600',
         action: () => {
            setLabelType('barcode');
            setIsLabelModalOpen(true);
         }
      },
      {
         icon: Download,
         label: 'Export Data',
         description: 'Backup all your data',
         color: 'bg-purple-100 text-purple-600',
         action: exportData
      },
      {
         icon: Upload,
         label: 'Import Data',
         description: 'Restore from backup',
         color: 'bg-amber-100 text-amber-600',
         action: () => document.getElementById('import-file')?.click()
      },
      {
         icon: Database,
         label: 'Clear Cache',
         description: 'Free up storage space',
         color: 'bg-red-100 text-red-600',
         action: () => {
            if (window.confirm('Clear all cached data?')) {
               localStorage.clear();
               alert('Cache cleared successfully!');
            }
         }
      },
      {
         icon: RefreshCw,
         label: 'Sync Data',
         description: 'Sync with cloud',
         color: 'bg-indigo-100 text-indigo-600',
         action: () => alert('Cloud sync feature coming soon!')
      }
   ];

   return (
      <div className="space-y-6">
         {/* Header */}
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Utilities</h1>
            <p className="text-sm text-slate-600 mt-1">Useful tools and utilities</p>
         </div>

         {/* Tally Export Section */}
         <Card padding="md">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
               <FileText className="w-5 h-5 text-emerald-600" />
               Tally Export
            </h2>
            <p className="text-xs text-slate-600 mb-4">Export your data in Tally-compatible formats</p>
            <div className="grid grid-cols-2 gap-3">
               <Button
                  onClick={exportToTallyXML}
                  variant="outline"
                  disabled={isExporting}
                  className="flex items-center gap-2 justify-center"
               >
                  <FileText className="w-4 h-4" />
                  Export XML
               </Button>
               <Button
                  onClick={exportToTallyCSV}
                  variant="outline"
                  disabled={isExporting}
                  className="flex items-center gap-2 justify-center"
               >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export CSV
               </Button>
            </div>
         </Card>

         {/* Bulk Data Management */}
         <Card padding="md">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
               <Database className="w-5 h-5 text-blue-600" />
               Bulk Data Management
            </h2>
            <p className="text-xs text-slate-600 mb-4">Import and export data in bulk</p>

            <div className="space-y-3">
               <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Export</h3>
                  <Button
                     onClick={exportAllData}
                     variant="outline"
                     disabled={isExporting}
                     className="w-full flex items-center gap-2 justify-center"
                  >
                     <Download className="w-4 h-4" />
                     Export All Data (Excel)
                  </Button>
               </div>

               <div className="border-t border-slate-200 pt-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Import</h3>
                  <Button
                     onClick={() => setIsImportModalOpen(true)}
                     variant="outline"
                     className="w-full flex items-center gap-2 justify-center"
                  >
                     <Upload className="w-4 h-4" />
                     Bulk Import from CSV
                  </Button>
               </div>

               <div className="border-t border-slate-200 pt-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Templates</h3>
                  <div className="grid grid-cols-3 gap-2">
                     <button
                        onClick={() => downloadTemplate('customers')}
                        className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                     >
                        Customers
                     </button>
                     <button
                        onClick={() => downloadTemplate('inventory')}
                        className="px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                     >
                        Inventory
                     </button>
                     <button
                        onClick={() => downloadTemplate('invoices')}
                        className="px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                     >
                        Invoices
                     </button>
                  </div>
               </div>
            </div>
         </Card>

         {/* Utilities Grid */}
         <div className="grid grid-cols-2 gap-3">
            {utilities.map((util) => (
               <Card
                  key={util.label}
                  padding="md"
                  onClick={util.action}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
               >
                  <div className="space-y-3">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${util.color}`}>
                        <util.icon className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-900 text-sm mb-1">{util.label}</h3>
                        <p className="text-xs text-slate-600">{util.description}</p>
                     </div>
                  </div>
               </Card>
            ))}
         </div>

         {/* Hidden file input for import */}
         <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
         />

         {/* Label Generator Modal */}
         <Modal
            isOpen={isLabelModalOpen}
            onClose={() => setIsLabelModalOpen(false)}
            title={`Generate ${labelType === 'qr' ? 'QR Code' : 'Barcode'}`}
            size="md"
         >
            <div className="space-y-4">
               <Input
                  label="Text / Number"
                  type="text"
                  placeholder={labelType === 'qr' ? 'Enter text or URL' : 'Enter number or text'}
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  icon={labelType === 'qr' ? <QrCode className="w-5 h-5" /> : <Barcode className="w-5 h-5" />}
               />

               <div className="border-t border-slate-200 pt-4 mt-6 flex gap-3">
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => setIsLabelModalOpen(false)}
                     className="flex-1"
                  >
                     Cancel
                  </Button>
                  <Button
                     onClick={generateLabel}
                     className="flex-1"
                  >
                     Generate & Download
                  </Button>
               </div>
            </div>
         </Modal>

         {/* Bulk Import Modal */}
         <Modal
            isOpen={isImportModalOpen}
            onClose={() => {
               setIsImportModalOpen(false);
               setImportFile(null);
               setImportStatus(null);
               setValidationErrors([]);
            }}
            title="Bulk Import from CSV"
            size="md"
         >
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Import Type</label>
                  <div className="grid grid-cols-2 gap-2">
                     <button
                        onClick={() => setImportType('customers')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${importType === 'customers'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                           }`}
                     >
                        Customers
                     </button>
                     <button
                        onClick={() => setImportType('inventory')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${importType === 'inventory'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                           }`}
                     >
                        Inventory
                     </button>
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Upload CSV File</label>
                  <input
                     type="file"
                     accept=".csv"
                     onChange={handleImportFile}
                     className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {importFile && (
                     <p className="mt-2 text-xs text-slate-600">Selected: {importFile.name}</p>
                  )}
               </div>

               {importStatus && (
                  <div className={`p-3 rounded-lg flex items-start gap-2 ${importStatus.type === 'success' ? 'bg-green-50' : 'bg-red-50'
                     }`}>
                     {importStatus.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                     ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                     )}
                     <div className="flex-1">
                        <p className={`text-sm font-medium ${importStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                           }`}>
                           {importStatus.message}
                        </p>
                        {validationErrors.length > 0 && (
                           <ul className="mt-2 text-xs text-red-700 list-disc list-inside space-y-1">
                              {validationErrors.slice(0, 5).map((error, idx) => (
                                 <li key={idx}>{error}</li>
                              ))}
                              {validationErrors.length > 5 && (
                                 <li>...and {validationErrors.length - 5} more errors</li>
                              )}
                           </ul>
                        )}
                     </div>
                  </div>
               )}

               <div className="border-t border-slate-200 pt-4 mt-6 flex gap-3">
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => {
                        setIsImportModalOpen(false);
                        setImportFile(null);
                        setImportStatus(null);
                        setValidationErrors([]);
                     }}
                     className="flex-1"
                  >
                     Cancel
                  </Button>
                  <Button
                     onClick={processImport}
                     disabled={!importFile || importStatus?.type === 'success'}
                     className="flex-1"
                  >
                     Import
                  </Button>
               </div>
            </div>
         </Modal>
      </div>
   );
};

export default UtilitiesPage;
