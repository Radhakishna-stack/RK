import React, { useState } from 'react';
import { Download, Upload, QrCode, Barcode, FileText, Database, RefreshCw, Share2 } from 'lucide-react';
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
      </div>
   );
};

export default UtilitiesPage;
