
import { Customer, Visitor, Complaint, Invoice, InvoiceItem, InventoryItem, Expense, ComplaintStatus, DashboardStats, ServiceReminder, AdSuggestion, AppSettings, StockTransaction, Salesman, StockWantingItem, RecycleBinItem, RecycleBinCategory, Transaction, BankAccount, User, UserRole, PaymentReceipt } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { encryptPassword } from './auth';

// ============================================
// Google Sheets Sync Layer
// ============================================

const GAS_URL_KEY = 'gas_url';

function getGasUrl(): string {
  return localStorage.getItem(GAS_URL_KEY) || '';
}

function isCloudEnabled(): boolean {
  return !!getGasUrl();
}

/**
 * Fire-and-forget: POST to Google Apps Script in background.
 * Does NOT block the UI. Errors are silently logged.
 */
function syncToCloud(action: string, data?: any): void {
  const url = getGasUrl();
  if (!url) return;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, data: data || {} }),
  }).catch(err => console.warn('[CloudSync]', action, 'failed:', err.message));
}

/**
 * Fetch data from Google Sheets cloud. Returns null if not configured or fails.
 */
async function fetchFromCloud(action: string, data?: any): Promise<any | null> {
  const url = getGasUrl();
  if (!url) return null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, data: data || {} }),
    });
    const result = await res.json();
    if (result.success) return result.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Migrate all localStorage data to Google Sheets in one go.
 */
async function migrateToCloud(): Promise<string> {
  const url = getGasUrl();
  if (!url) return 'No GAS URL configured. Set it first in Settings.';

  const entities = [
    { lsKey: 'mg_customers', sheet: 'Customers', fields: ['id', 'name', 'phone', 'bikeNumber', 'city', 'email', 'address', 'gstin', 'loyaltyPoints', 'createdAt'] },
    { lsKey: 'mg_invoices', sheet: 'Invoices', fields: (item: any) => [item.id, item.complaintId || '', item.bikeNumber || '', item.customerName || '', item.customerPhone || '', item.details || '', JSON.stringify(item.items || []), item.estimatedCost || 0, item.finalAmount || 0, item.taxAmount || 0, item.subTotal || 0, item.paymentStatus || '', item.accountId || '', item.paymentMode || '', item.date || '', item.odometerReading || '', item.docType || 'Sale', item.serviceReminderDate || '', item.paymentCollections?.cash || 0, item.paymentCollections?.upi || 0, item.paymentCollections?.upiAccountId || ''] },
    { lsKey: 'mg_inventory', sheet: 'Inventory', fields: ['id', 'name', 'category', 'stock', 'unitPrice', 'purchasePrice', 'itemCode', 'gstRate', 'hsn', 'lastUpdated'] },
    { lsKey: 'mg_transactions', sheet: 'Transactions', fields: (item: any) => [item.id, item.entityId || '', item.accountId || '', item.type || '', item.amount || 0, item.paymentMode || '', item.date || '', item.description || '', item.category || '', item.status || '', item.chequeNumber || '', item.partyName || '', item.bankName || '', JSON.stringify(item.items || [])] },
    { lsKey: 'mg_expenses', sheet: 'Expenses', fields: ['id', 'description', 'amount', 'category', 'date', 'paymentMode', 'transactionId', 'accountId'] },
    { lsKey: 'mg_bank_accounts', sheet: 'BankAccounts', fields: ['id', 'name', 'bankName', 'accountNumber', 'type', 'openingBalance', 'createdAt'] },
    { lsKey: 'mg_payment_receipts', sheet: 'PaymentReceipts', fields: ['id', 'receiptNumber', 'customerId', 'customerName', 'customerPhone', 'bikeNumber', 'cashAmount', 'upiAmount', 'totalAmount', 'date', 'description', 'createdAt'] },
    { lsKey: 'mg_complaints', sheet: 'Complaints', fields: (item: any) => [item.id, item.bikeNumber || '', item.customerName || '', item.customerPhone || '', item.details || '', (item.photoUrls || []).join(','), item.estimatedCost || 0, item.status || '', item.createdAt || '', item.dueDate || '', item.odometerReading || ''] },
    { lsKey: 'mg_stock_wanting', sheet: 'StockWanting', fields: ['id', 'partNumber', 'itemName', 'quantity', 'rate', 'createdAt'] },
    { lsKey: 'mg_visitors', sheet: 'Visitors', fields: (item: any) => [item.id, item.name || '', item.bikeNumber || '', item.phone || '', item.remarks || '', item.type || '', (item.photoUrls || []).join(','), item.createdAt || ''] },
    { lsKey: 'mg_reminders', sheet: 'ServiceReminders', fields: ['id', 'bikeNumber', 'customerName', 'phone', 'reminderDate', 'serviceType', 'status', 'lastNotified', 'message', 'serviceDate'] },
    { lsKey: 'mg_users', sheet: 'Users', fields: ['id', 'username', 'password', 'role', 'name', 'phone', 'createdAt', 'isActive'] },
    { lsKey: 'mg_salesmen', sheet: 'Salesmen', fields: ['id', 'name', 'phone', 'target', 'salesCount', 'totalSalesValue', 'joinDate', 'status'] },
  ];

  const results: string[] = [];
  let total = 0;

  for (const entity of entities) {
    const raw = localStorage.getItem(entity.lsKey);
    if (!raw) continue;
    try {
      const items = JSON.parse(raw);
      if (!Array.isArray(items) || !items.length) continue;

      const rows = items.map((item: any) => {
        if (typeof entity.fields === 'function') return entity.fields(item);
        return entity.fields.map(f => {
          let val = (item as any)[f];
          if (Array.isArray(val)) val = val.join(',');
          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          return val ?? '';
        });
      });

      await fetchFromCloud('bulkImport', { sheetName: entity.sheet, rows });
      total += items.length;
      results.push(`✅ ${entity.sheet}: ${items.length} rows`);
    } catch (err: any) {
      results.push(`❌ ${entity.sheet}: ${err.message}`);
    }
  }

  // Migrate settings
  const settings = localStorage.getItem('mg_settings');
  if (settings) {
    await fetchFromCloud('setConfig', { key: 'app_settings', value: settings });
    results.push('✅ Settings migrated');
  }

  return `Migration complete! ${total} records migrated.\n\n${results.join('\n')}`;
}

const LS_KEYS = {
  CUSTOMERS: 'mg_customers',
  VISITORS: 'mg_visitors',
  STOCK_WANTING: 'mg_stock_wanting',
  COMPLAINTS: 'mg_complaints',
  INVOICES: 'mg_invoices',
  INVENTORY: 'mg_inventory',
  EXPENSES: 'mg_expenses',
  REMINDERS: 'mg_reminders',
  SETTINGS: 'mg_settings',
  ROLE_PERMISSIONS: 'mg_role_permissions',
  STOCK_TXNS: 'mg_stock_txns',
  TRANSACTIONS: 'mg_transactions',
  SALESMEN: 'mg_salesmen',
  WA_STATUS: 'mg_wa_status',
  RECYCLE_BIN: 'mg_recycle_bin',
  BANK_ACCOUNTS: 'mg_bank_accounts',
  USERS: 'mg_users',
  PAYMENT_RECEIPTS: 'mg_payment_receipts'
};

const DEFAULT_BANK: BankAccount = {
  id: 'CASH-01',
  name: 'CASH IN HAND',
  type: 'Cash',
  openingBalance: 0,
  createdAt: new Date().toISOString()
};

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    businessAddress: '123 Main Street, Sector 7, New Delhi, 110001',
    businessPhone: '+91 98765 43210',
    passcodeEnabled: false,
    passcode: '',
    currency: '₹',
    decimalPlaces: 2,
    stopNegativeStock: true,
    blockNewItems: false,
    features: { estimates: true, proforma: false, orders: false, challan: true, fixedAssets: false },
    multiFirm: false,
    auditTrail: true,
    recycleBinDays: 30
  },
  transaction: {
    showInvoiceNumber: true,
    cashSaleDefault: true,
    billingName: true,
    poDetails: false,
    addTime: false,
    inclusiveTax: true,
    showPurchasePrice: true,
    freeItemQuantity: false,
    countChangeLabel: 'Quantity',
    countChange: false,
    barcodeScanning: false,
    txnWiseTax: false,
    txnWiseDiscount: true,
    roundOffTransaction: true,
    shareTransactionAs: 'PDF',
    passcodeEditDelete: false,
    discountDuringPayment: false,
    linkPaymentsToInvoices: true,
    dueDatesAndTerms: true,
    enableInvoicePreview: true,
    showProfit: false,
    additionalFields: false,
    transportationDetails: false,
    additionalCharges: false,
    overdueDaysLimit: 15,
    prefixes: { firmName: 'MOTO GEAR SRK', sale: 'INV-', estimate: 'EST-', creditNote: 'CN-', saleOrder: 'None', purchaseOrder: 'SBS-', paymentIn: 'PI-' }
  },
  print: {
    printerType: 'Regular',
    theme: 'Pro Theme 1',
    textSize: 'Medium',
    pageSize: 'A4',
    orientation: 'Portrait',
    showUnsavedWarning: true,
    showCompanyName: true,
    companyNameSize: 'Small',
    showLogo: true,
    showAddress: true,
    showEmail: true,
    showPhoneNumber: true,
    showGstin: false,
    printBillOfSupply: false,
    extraSpacesTop: 0,
    printOriginalDuplicate: false,
    minRowsInTable: 0,
    totalItemQuantity: true,
    amountWithDecimal: true,
    receivedAmount: true,
    balanceAmount: true,
    printCurrentBalance: false,
    taxDetails: false,
    amountGrouping: true,
    amountInWordsFormat: 'Indian',
    showYouSaved: false,
    printDescription: true,
    printReceivedBy: true,
    printDeliveredBy: false,
    printSignatureText: false,
    customSignatureText: '',
    printPaymentMode: false,
    printAcknowledgement: false
  },
  gst: { enabled: true, showHsn: true, rcm: false, placeOfSupply: true, composite: false, reverseCharge: false, stateOfSupply: true, ewayBill: false },
  messages: { channel: 'WhatsApp', sendToParty: true, copyToSelf: false, template: 'Hi {{CustomerName}}, your bill of {{InvoiceAmount}} for bike {{BikeNumber}} is ready at Moto Gear SRK.', transactionMessaging: { sendToParty: true, smsCopyToSelf: false, txnUpdateSms: false, showPartyBalance: false, showWebInvoiceLink: false, autoShareVyapar: false, autoMsgTypes: { sale: true, purchase: false, saleReturn: false, purchaseReturn: false, estimate: false, proforma: false, paymentIn: false, paymentOut: false, saleOrder: true, purchaseOrder: false, deliveryChallan: false, cancelledInvoice: false } } },
  party: { gstin: true, grouping: false, shippingAddress: true, loyaltyPoints: true, loyaltyRate: 100, paymentReminders: true, reminderOffset: 3, additionalFields: [{ label: 'GSTIN', showOnPrint: true }] },
  item: { isProduct: true, stockMaintenance: true, serialTracking: false, batchTracking: false, mrpColumn: true },
  reminders: { enabled: true, autoSchedule: true, manualDateSelection: true, defaultInterval: '3 Months', reminderTemplate: 'Hello {{CustomerName}}, your bike {{BikeNumber}} is due for service.', reminderDaysBefore: 3, remindersPerDay: 1 },
  accounting: { enabled: false, allowJournalEntries: false }
};

// Import default permissions to use as fallback
import { ROLE_PERMISSIONS as DEFAULT_ROLE_PERMISSIONS } from './permissions';
import { RolePermissions } from './types';

// Helper function to generate unique IDs with random component
const generateUniqueId = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

// Helper function to create or update customer records
const upsertCustomer = async (customerData: {
  customerName: string;
  bikeNumber: string;
  customerPhone?: string;
  city?: string;
}): Promise<void> => {
  const currentCustomers = await dbService.getCustomers();
  const existingCustIndex = currentCustomers.findIndex(c =>
    c.bikeNumber.toUpperCase() === customerData.bikeNumber.toUpperCase()
  );

  if (existingCustIndex !== -1) {
    // Update existing customer details
    currentCustomers[existingCustIndex] = {
      ...currentCustomers[existingCustIndex],
      name: customerData.customerName,
      phone: customerData.customerPhone || currentCustomers[existingCustIndex].phone,
      city: customerData.city || currentCustomers[existingCustIndex].city
    };
  } else {
    // Create new customer record
    currentCustomers.push({
      id: generateUniqueId('C'),
      name: customerData.customerName,
      bikeNumber: customerData.bikeNumber.toUpperCase(),
      phone: customerData.customerPhone || '',
      city: customerData.city || '',
      loyaltyPoints: 0,
      createdAt: new Date().toISOString()
    });
  }

  // Persist updated customer list
  localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify(currentCustomers));
};

export const dbService = {
  getConnectionStatus: () => 'connected',

  getSettings: async (): Promise<AppSettings> => {
    const local = localStorage.getItem(LS_KEYS.SETTINGS);
    return local ? JSON.parse(local) : DEFAULT_SETTINGS;
  },

  updateSettings: async (settings: AppSettings): Promise<void> => {
    localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Parse location coordinates from Google Maps / WhatsApp links
  parseLocationFromLink: (text: string): { lat: number, lng: number, address?: string } | null => {
    if (!text) return null;
    const cleanText = text.replace(/[\"\']/g, '').trim();

    // Direct coordinates format: "lat, lng"
    const directRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const directMatch = cleanText.match(directRegex);
    if (directMatch) return { lat: parseFloat(directMatch[1]), lng: parseFloat(directMatch[2]) };

    // Google Maps desktop format: @lat,lng
    const desktopRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const desktopMatch = cleanText.match(desktopRegex);
    if (desktopMatch) return { lat: parseFloat(desktopMatch[1]), lng: parseFloat(desktopMatch[2]) };

    // Query parameter formats: ?q=lat,lng or ?ll=lat,lng
    const queryRegex = /[?&/](q|query|ll|search\/)(=?)(-?\d+\.\d+),(-?\d+\.\d+)/;
    const queryMatch = cleanText.match(queryRegex);
    if (queryMatch) return { lat: parseFloat(queryMatch[3]), lng: parseFloat(queryMatch[4]) };

    // Place/directions format: /place/lat,lng or /dir/lat,lng
    const placeRegex = /\/(place|dir)\/(-?\d+\.\d+),(-?\d+\.\d+)/;
    const placeMatch = cleanText.match(placeRegex);
    if (placeMatch) return { lat: parseFloat(placeMatch[2]), lng: parseFloat(placeMatch[3]) };

    // Street view format: ?cbll=lat,lng
    const streetRegex = /[?&]cbll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const streetMatch = cleanText.match(streetRegex);
    if (streetMatch) return { lat: parseFloat(streetMatch[1]), lng: parseFloat(streetMatch[2]) };

    return null;
  },

  // Resolve location via AI when regex parsing fails
  resolveLocationViaAI: async (text: string): Promise<{ lat: number, lng: number, address: string } | { error: string } | null> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        console.error('No Gemini API key found');
        return null;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Precisely identify GPS coordinates for: "${text}". Result must be valid JSON with lat, lng, address.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              address: { type: Type.STRING }
            },
            required: ["lat", "lng", "address"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.lat && result.lng) return result;
      return null;
    } catch (e: any) {
      console.error("AI Location Resolution Failed", e);
      if (e?.message?.includes('429') || e?.message?.includes('RESOURCE_EXHAUSTED')) {
        return { error: 'QUOTA_EXCEEDED' };
      }
      return null;
    }
  },

  getAdSuggestions: async (inventory: InventoryItem[]): Promise<AdSuggestion[]> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) return [];
      const ai = new GoogleGenAI({ apiKey });
      const itemsList = inventory.map(i => `${i.name} (${i.category})`).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Based on these inventory items: ${itemsList}, suggest 3 promotional ads. Focus on bike maintenance and technical precision.`
      });
      // Mocked parsing for now
      return [
        { id: generateUniqueId('AD'), headline: 'Monsoon Special', copy: response.text || 'Prepare your bike for rains!', platform: 'WhatsApp', targetAudience: 'Bike Owners', estimatedPerformance: 'High' }
      ];
    } catch (e) {
      return [];
    }
  },

  getBankAccounts: async (): Promise<BankAccount[]> => {
    const local = localStorage.getItem(LS_KEYS.BANK_ACCOUNTS);
    if (!local) {
      const initial = [DEFAULT_BANK];
      localStorage.setItem(LS_KEYS.BANK_ACCOUNTS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(local);
  },

  addBankAccount: async (data: Omit<BankAccount, 'id' | 'createdAt'>): Promise<BankAccount> => {
    const current = await dbService.getBankAccounts();
    const newBank = { ...data, id: 'BANK-' + Date.now(), createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.BANK_ACCOUNTS, JSON.stringify([...current, newBank]));
    syncToCloud('addBankAccount', newBank);
    return newBank;
  },

  deleteBankAccount: async (id: string): Promise<void> => {
    if (id === 'CASH-01') throw new Error("Cannot delete primary Cash account");
    const current = await dbService.getBankAccounts();
    localStorage.setItem(LS_KEYS.BANK_ACCOUNTS, JSON.stringify(current.filter(b => b.id !== id)));
    syncToCloud('deleteBankAccount', { id });
  },

  getAllRolePermissions: async (): Promise<Record<string, RolePermissions>> => {
    const local = localStorage.getItem(LS_KEYS.ROLE_PERMISSIONS);
    return local ? JSON.parse(local) : DEFAULT_ROLE_PERMISSIONS;
  },

  updateRolePermissions: async (role: string, permissions: RolePermissions): Promise<void> => {
    const current = await dbService.getAllRolePermissions();
    const updated = { ...current, [role]: permissions };
    localStorage.setItem(LS_KEYS.ROLE_PERMISSIONS, JSON.stringify(updated));
  },


  getAccountBalance: async (accountId: string): Promise<number> => {
    const accounts = await dbService.getBankAccounts();
    const target = accounts.find(a => a.id === accountId);
    if (!target) return 0;

    const txns = await dbService.getTransactions();
    const accountTxns = txns.filter(t => t.accountId === accountId);

    const flow = accountTxns.reduce((sum, t) => t.type === 'IN' ? sum + t.amount : sum - t.amount, 0);
    return (target.openingBalance || 0) + flow;
  },

  getBusinessHoroscope: async (businessName: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Short, motivational business insight for motor bike service center "${businessName}". Focus on technical excellence, rider safety, and precision tuning. Max 30 words.`
    });
    return response.text || "Smooth ride ahead!";
  },

  searchLocalMarket: async (query: string, lat: number, lng: number): Promise<{ text: string, grounding: any[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Explore "${query}" specifically for motorcycle parts, riding gear, or bike repair shops near these coordinates.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
      }
    });
    return {
      text: response.text || "Searching local bike databases...",
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  },

  /**
   * AI Resolver for location links that don't have coordinates in the URL (like short links)
   */

  sendWhatsApp: (phone: string, message: string) => {
    const formatted = phone.replace(/\D/g, '');
    const url = `https://wa.me/${formatted.length === 10 ? '91' + formatted : formatted}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  getCustomers: async (): Promise<Customer[]> => JSON.parse(localStorage.getItem(LS_KEYS.CUSTOMERS) || '[]'),
  addCustomer: async (data: any): Promise<Customer> => {
    const current = await dbService.getCustomers();
    const newUser = { ...data, id: 'C' + Date.now(), loyaltyPoints: 0, createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify([...current, newUser]));
    syncToCloud('addCustomer', newUser);
    return newUser;
  },
  updateCustomerLoyalty: async (id: string, points: number): Promise<void> => {
    const current = await dbService.getCustomers();
    localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify(current.map(c => c.id === id ? { ...c, loyaltyPoints: points } : c)));
  },
  deleteCustomer: async (id: string): Promise<void> => {
    const current = await dbService.getCustomers();
    const itemToDelete = current.find(c => c.id === id);
    if (itemToDelete) {
      await dbService.moveToRecycleBin('Customer', itemToDelete);
      localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify(current.filter(c => c.id !== id)));
      syncToCloud('deleteCustomer', { id });
    }
  },

  getTransactions: async (): Promise<Transaction[]> => JSON.parse(localStorage.getItem(LS_KEYS.TRANSACTIONS) || '[]'),
  addTransaction: async (data: any): Promise<Transaction> => {
    const settings = await dbService.getSettings();
    const prefix = settings.transaction.prefixes.paymentIn || 'PI-';
    const current = await dbService.getTransactions();
    const newTxn = {
      ...data,
      id: prefix + Date.now(),
      date: new Date().toISOString(),
      accountId: data.accountId || 'CASH-01'
    };
    localStorage.setItem(LS_KEYS.TRANSACTIONS, JSON.stringify([newTxn, ...current]));
    syncToCloud('addTransaction', newTxn);
    return newTxn;
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const transactions = await dbService.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      localStorage.setItem(LS_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      syncToCloud('updateTransaction', transactions[index]);
    }
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const transactions = await dbService.getTransactions();
    localStorage.setItem(LS_KEYS.TRANSACTIONS, JSON.stringify(transactions.filter(t => t.id !== id)));
    syncToCloud('deleteTransaction', { id });
  },

  getCustomerBalance: async (bikeNumber: string, customerName: string): Promise<number> => {
    const invoices = await dbService.getInvoices();
    const txns = await dbService.getTransactions();

    const customerInvoices = invoices.filter(inv =>
      inv.docType === 'Sale' && (inv.bikeNumber === bikeNumber || inv.customerName === customerName)
    );
    const totalBilled = customerInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

    const prepaidAmount = customerInvoices
      .filter(inv => inv.paymentStatus === 'Paid')
      .reduce((sum, inv) => sum + inv.finalAmount, 0);

    const manualPayments = txns.filter(t =>
      t.type === 'IN' && t.entityId === bikeNumber
    ).reduce((sum, t) => sum + t.amount, 0);

    return totalBilled - prepaidAmount - manualPayments;
  },

  getVisitors: async (): Promise<Visitor[]> => JSON.parse(localStorage.getItem(LS_KEYS.VISITORS) || '[]'),
  addVisitor: async (data: any): Promise<Visitor> => {
    const current = await dbService.getVisitors();
    const newVisitor = { ...data, id: 'V' + Date.now(), createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.VISITORS, JSON.stringify([newVisitor, ...current]));
    syncToCloud('addVisitor', newVisitor);
    return newVisitor;
  },
  deleteVisitor: async (id: string): Promise<void> => {
    const current = await dbService.getVisitors();
    const itemToDelete = current.find(v => v.id === id);
    if (itemToDelete) {
      await dbService.moveToRecycleBin('Visitor', itemToDelete);
      localStorage.setItem(LS_KEYS.VISITORS, JSON.stringify(current.filter(v => v.id !== id)));
      syncToCloud('deleteVisitor', { id });
    }
  },

  getStockWanting: async (): Promise<StockWantingItem[]> => JSON.parse(localStorage.getItem(LS_KEYS.STOCK_WANTING) || '[]'),
  addStockWantingItem: async (data: Omit<StockWantingItem, 'id' | 'createdAt'>): Promise<StockWantingItem> => {
    const current = await dbService.getStockWanting();
    const newItem = { ...data, id: 'W' + Date.now(), createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.STOCK_WANTING, JSON.stringify([...current, newItem]));
    syncToCloud('addStockWanting', newItem);
    return newItem;
  },
  deleteStockWantingItem: async (id: string): Promise<void> => {
    const current = await dbService.getStockWanting();
    localStorage.setItem(LS_KEYS.STOCK_WANTING, JSON.stringify(current.filter(i => i.id !== id)));
    syncToCloud('deleteStockWanting', { id });
  },

  getComplaints: async (): Promise<Complaint[]> => JSON.parse(localStorage.getItem(LS_KEYS.COMPLAINTS) || '[]'),
  addComplaint: async (data: any): Promise<Complaint> => {
    const currentComplaints = await dbService.getComplaints();
    const newComplaint = {
      ...data,
      id: 'B' + Date.now(),
      status: ComplaintStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    // Auto-save/update customer details using helper
    await upsertCustomer({
      customerName: data.customerName,
      bikeNumber: data.bikeNumber,
      customerPhone: data.customerPhone,
      city: data.city
    });

    // Save complaint
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify([newComplaint, ...currentComplaints]));
    syncToCloud('addComplaint', newComplaint);
    return newComplaint;
  },
  updateComplaint: async (id: string, data: Partial<Complaint>): Promise<void> => {
    const current = await dbService.getComplaints();
    const index = current.findIndex(c => c.id === id);

    if (index === -1) {
      throw new Error(`Complaint ${id} not found`);
    }

    // Merge updates with existing complaint
    current[index] = { ...current[index], ...data, id }; // Preserve ID
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(current));
    syncToCloud('updateComplaint', current[index]);
  },
  updateComplaintStatus: async (id: string, status: ComplaintStatus): Promise<void> => {
    const current = await dbService.getComplaints();
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(current.map(c => c.id === id ? { ...c, status } : c)));
  },
  updateComplaintPhotos: async (id: string, photos: string[]): Promise<void> => {
    const current = await dbService.getComplaints();
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(current.map(c => c.id === id ? { ...c, photoUrls: photos } : c)));
  },
  deleteComplaint: async (id: string): Promise<void> => {
    const current = await dbService.getComplaints();
    const itemToDelete = current.find(c => c.id === id);
    if (itemToDelete) {
      await dbService.moveToRecycleBin('Complaint', itemToDelete);
      localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(current.filter(c => c.id !== id)));
      syncToCloud('deleteComplaint', { id });
    }
  },

  getInvoices: async (): Promise<Invoice[]> => JSON.parse(localStorage.getItem(LS_KEYS.INVOICES) || '[]'),
  generateInvoice: async (data: any): Promise<Invoice> => {
    const currentInvoices = await dbService.getInvoices();
    const accounts = await dbService.getBankAccounts();

    // Auto-save/update customer details using helper
    await upsertCustomer({
      customerName: data.customerName,
      bikeNumber: data.bikeNumber,
      customerPhone: data.customerPhone
    });

    // Handle Invoice creation
    const newInv = { ...data, id: 'I' + Date.now(), date: data.date || new Date().toISOString() };
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify([newInv, ...currentInvoices]));
    syncToCloud('addInvoice', newInv);

    // Stock Deduction Logic (Only for Sales)
    if (data.docType === 'Sale' && data.items && data.items.length > 0) {
      const inventory = await dbService.getInventory();
      for (const item of data.items) {
        // Find Inventory Item by exact name match
        const invItem = inventory.find(i => i.name.toLowerCase() === item.description.toLowerCase());
        if (invItem) {
          await dbService.updateStock(invItem.id, -(item.quantity || 1), 'Sale');
        }
      }
    }

    // Handle payment collections (Cash and UPI)
    if (data.paymentCollections) {
      const { cash, upi } = data.paymentCollections;

      // Create Cash transaction if cash amount > 0
      if (cash > 0) {
        const cashAccount = accounts.find(a => a.type === 'Cash');
        if (cashAccount) {
          await dbService.addTransaction({
            entityId: data.bikeNumber,
            accountId: cashAccount.id,
            type: 'IN',
            amount: cash,
            paymentMode: 'Cash',
            description: `Payment for Invoice ${newInv.id} - ${data.customerName}`
          });
        }
      }

      // Create UPI transaction if UPI amount > 0
      if (upi > 0) {
        // Use selected account OR fallback to finding one
        let upiAccount = accounts.find(a => a.id === data.paymentCollections.upiAccountId);

        // Fallback: Find UPI/Wallet or any non-cash
        if (!upiAccount) {
          upiAccount = accounts.find(a => a.type === 'UPI' || a.type === 'Wallet') || accounts.find(a => a.type !== 'Cash');
        }

        if (upiAccount) {
          await dbService.addTransaction({
            entityId: data.bikeNumber,
            accountId: upiAccount.id,
            type: 'IN',
            amount: upi,
            paymentMode: 'UPI',
            description: `Payment for Invoice ${newInv.id} - ${data.customerName}`
          });
        }
      }
    }

    // Update loyalty points if payment is made
    if (data.paymentStatus === 'Paid' || data.paymentStatus === 'Pending') {
      const settings = await dbService.getSettings();
      const rate = settings.party.loyaltyRate || 100;

      // Calculate loyalty points based on amount paid, not total invoice amount
      let paidAmount = data.finalAmount;
      if (data.paymentCollections && data.paymentStatus === 'Pending') {
        paidAmount = (data.paymentCollections.cash || 0) + (data.paymentCollections.upi || 0);
      }

      const earned = Math.floor(paidAmount / rate);

      // Fetch customer after upsert to get the latest data
      const updatedCustomers = await dbService.getCustomers();
      const cust = updatedCustomers.find(c => c.bikeNumber.toUpperCase() === data.bikeNumber.toUpperCase());
      if (cust && earned > 0) {
        await dbService.updateCustomerLoyalty(cust.id, (cust.loyaltyPoints || 0) + earned);
      }
    }

    // Auto-create Service Reminder if date is set
    if (data.serviceReminderDate) {
      const existingReminders = await dbService.getReminders();
      // Avoid duplicate reminder for same customer and date
      const duplicate = existingReminders.find(r =>
        r.bikeNumber === data.bikeNumber &&
        r.reminderDate === data.serviceReminderDate
      );

      if (!duplicate) {
        await dbService.addReminder({
          customerName: data.customerName,
          phone: data.customerPhone || '',
          bikeNumber: data.bikeNumber,
          reminderDate: data.serviceReminderDate,
          serviceType: 'General Service',
          status: 'Pending',
          message: `Hi ${data.customerName}, your bike service is due on ${data.serviceReminderDate}. Please visit us!`,
          serviceDate: data.serviceReminderDate // redundant but keeps type happy
        });
      }
    }

    return newInv;
  },

  /**
   * Update an existing invoice
   */
  updateInvoice: async (invoiceId: string, data: Partial<Invoice>): Promise<void> => {
    const currentInvoices = await dbService.getInvoices();
    const invoiceIndex = currentInvoices.findIndex(inv => inv.id === invoiceId);

    if (invoiceIndex === -1) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const existingInvoice = currentInvoices[invoiceIndex];

    // Update customer if details changed
    if (data.customerName || data.bikeNumber || data.customerPhone) {
      await upsertCustomer({
        customerName: data.customerName || existingInvoice.customerName,
        bikeNumber: data.bikeNumber || existingInvoice.bikeNumber,
        customerPhone: data.customerPhone || existingInvoice.customerPhone
      });
    }

    // Merge updates with existing invoice
    const updatedInvoice = {
      ...existingInvoice,
      ...data,
      id: invoiceId, // Prevent ID from being changed
      date: data.date || existingInvoice.date
    };

    // Update invoices list
    currentInvoices[invoiceIndex] = updatedInvoice;
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify(currentInvoices));
    syncToCloud('updateInvoice', updatedInvoice);

    // Handle payment collection changes
    if (data.paymentCollections) {
      const accounts = await dbService.getBankAccounts();
      const { cash, upi } = data.paymentCollections;

      // Note: In a real app, you'd want to handle transaction updates more carefully
      // For now, we'll delete old transactions and create new ones
      const existingTransactions = await dbService.getTransactions();

      // Remove old transactions for this invoice
      const filteredTransactions = existingTransactions.filter(t =>
        !t.description.includes(`Invoice ${invoiceId}`)
      );
      localStorage.setItem(LS_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));

      // Create new Cash transaction if cash amount > 0
      if (cash && cash > 0) {
        const cashAccount = accounts.find(a => a.type === 'Cash');
        if (cashAccount) {
          await dbService.addTransaction({
            entityId: data.bikeNumber || existingInvoice.bikeNumber,
            accountId: cashAccount.id,
            type: 'IN',
            amount: cash,
            paymentMode: 'Cash',
            description: `Payment for Invoice ${invoiceId} - ${data.customerName || existingInvoice.customerName}`
          });
        }
      }

      // Create new UPI transaction if UPI amount > 0
      if (upi && upi > 0) {
        let upiAccount = accounts.find(a => a.id === data.paymentCollections.upiAccountId);
        if (!upiAccount) {
          upiAccount = accounts.find(a => a.type === 'UPI' || a.type === 'Wallet') || accounts.find(a => a.type !== 'Cash');
        }

        if (upiAccount) {
          await dbService.addTransaction({
            entityId: data.bikeNumber || existingInvoice.bikeNumber,
            accountId: upiAccount.id,
            type: 'IN',
            amount: upi,
            paymentMode: 'UPI',
            description: `Payment for Invoice ${invoiceId} - ${data.customerName || existingInvoice.customerName}`
          });
        }
      }
    }
  },
  updateInvoicePaymentStatus: async (id: string, status: 'Paid' | 'Pending' | 'Unpaid'): Promise<void> => {
    const current = await dbService.getInvoices();
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify(current.map(i => i.id === id ? { ...i, paymentStatus: status } : i)));
  },
  deleteInvoice: async (id: string): Promise<void> => {
    const current = await dbService.getInvoices();
    const itemToDelete = current.find(i => i.id === id);

    if (itemToDelete) {
      // 1. Revert Stock Changes (Add back to inventory)
      // Only if it's a Sale (not Estimate)
      if (itemToDelete.docType === 'Sale' && itemToDelete.items) {
        for (const item of itemToDelete.items) {
          // Find inventory item by name/code to add stock back
          // We assume item.description contains the name or we need an ID. 
          // Current InvoiceItem structure might not have ID, so we search by name.
          const inventory = await dbService.getInventory();
          const invItem = inventory.find(i => i.name === item.description);

          if (invItem) {
            await dbService.updateStock(invItem.id, item.quantity, 'Sale Return');
            // Note: 'Sale Return' adds stock
          }
        }
      }

      // 2. Remove associated transactions (Cash/UPI payments)
      const transactions = await dbService.getTransactions();
      const filteredTransactions = transactions.filter(t =>
        !t.description.includes(`Invoice ${id}`)
      );
      localStorage.setItem(LS_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));

      // 3. Move to Recycle Bin & Delete Invoice
      await dbService.moveToRecycleBin('Invoice', itemToDelete);
      localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify(current.filter(i => i.id !== id)));
    }
  },

  getInventory: async (): Promise<InventoryItem[]> => JSON.parse(localStorage.getItem(LS_KEYS.INVENTORY) || '[]'),
  addInventoryItem: async (data: any): Promise<InventoryItem> => {
    const current = await dbService.getInventory();
    const newItem = { ...data, id: 'S' + Date.now(), lastUpdated: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify([...current, newItem]));
    syncToCloud('addInventoryItem', newItem);
    return newItem;
  },

  updateInventory: async (id: string, updates: Partial<InventoryItem>): Promise<void> => {
    const current = await dbService.getInventory();
    const updated = current.map(i => i.id === id ? { ...i, ...updates, lastUpdated: new Date().toISOString() } : i);
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(updated));
  },

  bulkUpdateInventory: async (updates: any[]): Promise<{ updated: number, created: number }> => {
    const current = await dbService.getInventory();
    let updatedCount = 0;
    let createdCount = 0;

    const updatedInventory = [...current];

    for (const update of updates) {
      // Check if item already exists by name or item code
      const index = updatedInventory.findIndex(i =>
        (update.itemCode && i.itemCode === update.itemCode) ||
        (update.name && i.name.toLowerCase() === update.name.toLowerCase())
      );

      if (index !== -1) {
        updatedInventory[index] = {
          ...updatedInventory[index],
          ...update,
          lastUpdated: new Date().toISOString()
        };
        updatedCount++;
      } else {
        // Create new item
        const newItem: InventoryItem = {
          id: 'S' + Date.now() + Math.random().toString(36).substr(2, 5),
          name: update.name || 'NEW ITEM',
          category: update.category || 'MISC',
          stock: parseFloat(update.stock) || 0,
          unitPrice: parseFloat(update.unitPrice) || 0,
          purchasePrice: parseFloat(update.purchasePrice) || 0,
          itemCode: update.itemCode || '',
          gstRate: parseFloat(update.gstRate) || 0,
          hsn: update.hsn || '',
          lastUpdated: new Date().toISOString()
        };
        updatedInventory.push(newItem);
        createdCount++;
      }
    }

    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(updatedInventory));
    return { updated: updatedCount, created: createdCount };
  },
  deleteInventoryItem: async (id: string): Promise<void> => {
    const current = await dbService.getInventory();
    const itemToDelete = current.find(i => i.id === id);
    if (itemToDelete) {
      await dbService.moveToRecycleBin('Inventory', itemToDelete);
      localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(current.filter(i => i.id !== id)));
      syncToCloud('deleteInventoryItem', { id });
    }
  },
  updateStock: async (id: string, delta: number, note: string): Promise<void> => {
    const inv = await dbService.getInventory();
    const updated = inv.map(i => i.id === id ? { ...i, stock: i.stock + delta, lastUpdated: new Date().toISOString() } : i);
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(updated));
    const txns = JSON.parse(localStorage.getItem(LS_KEYS.STOCK_TXNS) || '[]');
    txns.push({ id: 'T' + Date.now(), itemId: id, type: delta > 0 ? 'IN' : 'OUT', quantity: Math.abs(delta), date: new Date().toISOString(), note });
    localStorage.setItem(LS_KEYS.STOCK_TXNS, JSON.stringify(txns));
    syncToCloud('updateStock', { id, delta });
    syncToCloud('addStockTransaction', { itemId: id, type: delta > 0 ? 'IN' : 'OUT', quantity: Math.abs(delta), note });
  },
  getStockTransactions: async (itemId: string): Promise<StockTransaction[]> => {
    const txns = JSON.parse(localStorage.getItem(LS_KEYS.STOCK_TXNS) || '[]');
    return txns.filter((t: any) => t.itemId === itemId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getExpenses: async (): Promise<Expense[]> => JSON.parse(localStorage.getItem(LS_KEYS.EXPENSES) || '[]'),

  addExpense: async (data: any): Promise<Expense> => {
    const current = await dbService.getExpenses();
    const accounts = await dbService.getBankAccounts();

    // Determine Account ID
    let accountId = 'CASH-01'; // Default
    if (data.paymentMode === 'Cash') {
      accountId = 'CASH-01';
    } else {
      // Find a suitable bank/UPI account
      const bankAcc = accounts.find(a => a.type !== 'Cash' && (a.type === 'UPI' || a.type === 'Savings' || a.type === 'Current'));
      if (bankAcc) accountId = bankAcc.id;
      // If no specific match, leave as Cash or fallback? 
      // If user selected Card but we only have Cash account, it's ambiguous. 
      // But typically there's a Bank account.
    }

    // Create Transaction first
    const newTxn = await dbService.addTransaction({
      entityId: 'EXPENSE',
      accountId: accountId,
      type: 'OUT',
      amount: data.amount,
      paymentMode: data.paymentMode,
      description: `Expense: ${data.description} (${data.category})`,
      date: data.date || new Date().toISOString()
    });

    const newExp = {
      ...data,
      id: 'E' + Date.now(),
      date: data.date || new Date().toISOString(),
      transactionId: newTxn.id,
      accountId: accountId
    };

    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify([newExp, ...current]));
    syncToCloud('addExpense', newExp);
    return newExp;
  },

  deleteExpense: async (id: string): Promise<void> => {
    const current = await dbService.getExpenses();
    const itemToDelete = current.find(e => e.id === id);

    if (itemToDelete) {
      if (itemToDelete.transactionId) {
        await dbService.deleteTransaction(itemToDelete.transactionId);
      }

      await dbService.moveToRecycleBin('Expense', itemToDelete);
      localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(current.filter(e => e.id !== id)));
      syncToCloud('deleteExpense', { id });
    }
  },

  updateExpense: async (id: string, updates: Partial<Expense>): Promise<void> => {
    const current = await dbService.getExpenses();
    const expense = current.find(e => e.id === id);

    if (expense && expense.transactionId) {
      // Update linked transaction
      await dbService.updateTransaction(expense.transactionId, {
        amount: updates.amount !== undefined ? updates.amount : undefined, // Only update if changed
        date: updates.date,
        description: (updates.description || updates.category) ? `Expense: ${updates.description || expense.description} (${updates.category || expense.category})` : undefined
      });
    }

    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(current.map(e => e.id === id ? { ...e, ...updates } : e)));
  },

  getReminders: async (): Promise<ServiceReminder[]> => JSON.parse(localStorage.getItem(LS_KEYS.REMINDERS) || '[]'),
  addReminder: async (data: any): Promise<ServiceReminder> => {
    const current = await dbService.getReminders();
    const newRem = { ...data, id: 'R' + Date.now(), status: 'Pending' };
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify([...current, newRem]));
    syncToCloud('addReminder', newRem);
    return newRem;
  },
  updateReminderStatus: async (id: string, status: 'Pending' | 'Sent'): Promise<void> => {
    const current = await dbService.getReminders();
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify(current.map(r => r.id === id ? { ...r, status, lastNotified: new Date().toISOString() } : r)));
  },
  updateReminder: async (id: string, updates: Partial<ServiceReminder>): Promise<void> => {
    const current = await dbService.getReminders();
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify(current.map(r => r.id === id ? { ...r, ...updates } : r)));
  },
  deleteReminder: async (id: string): Promise<void> => {
    const current = await dbService.getReminders();
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify(current.filter(r => r.id !== id)));
    syncToCloud('deleteReminder', { id });
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const [c, j, i, e, txns, accounts] = await Promise.all([
        dbService.getCustomers(),
        dbService.getComplaints(),
        dbService.getInvoices(),
        dbService.getExpenses(),
        dbService.getTransactions(),
        dbService.getBankAccounts()
      ]);

      const totalRev = txns.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
      const pend = i.filter(inv => inv.paymentStatus === 'Unpaid').reduce((s, inv) => s + inv.finalAmount, 0);
      const exp = e.reduce((s, ex) => s + ex.amount, 0);

      // Calculate balances in-memory to avoid N+1 fetches
      let cashBal = 0;
      let bankBal = 0;

      // Create a map of account balances
      const accountBalances = new Map<string, number>();

      // Initialize with opening balances
      accounts.forEach(acc => {
        accountBalances.set(acc.id, acc.openingBalance || 0);
      });

      // Apply transactions
      txns.forEach(t => {
        const currentBal = accountBalances.get(t.accountId) || 0;
        const change = t.type === 'IN' ? t.amount : -t.amount;
        accountBalances.set(t.accountId, currentBal + change);
      });

      // Sum up based on account type
      accounts.forEach(acc => {
        const balance = accountBalances.get(acc.id) || 0;
        if (acc.type === 'Cash') {
          cashBal += balance;
        } else {
          bankBal += balance;
        }
      });

      return {
        totalCustomers: c.length,
        totalComplaints: j.length,
        totalInvoices: i.length,
        totalReceived: totalRev,
        totalPending: pend,
        totalExpenses: exp,
        netProfit: totalRev - exp,
        cashInHand: cashBal,
        bankBalance: bankBal
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalCustomers: 0,
        totalComplaints: 0,
        totalInvoices: 0,
        totalReceived: 0,
        totalPending: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashInHand: 0,
        bankBalance: 0
      };
    }
  },


  generateAdImage: async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A cinematic, ultra-high-resolution professional advertisement for a motor bike service center. Topic: ${prompt}. Show a clean, futuristic workshop, a professional mechanic working on a sports bike or cruiser, specialized tools, or a gleaming polished motorcycle. Premium aesthetic.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  },

  generateMarketingContent: async (topic: string): Promise<{ caption: string, tags: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a viral social media caption for a bike service promotion: "${topic}". Use rider-friendly emojis, technical keywords like Torque, Performance, and Stability. Include 5 hashtags for bike enthusiasts.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            tags: { type: Type.STRING },
          },
          required: ["caption", "tags"],
        }
      }
    });
    try {
      return JSON.parse(response.text || '{"caption": "", "tags": ""}');
    } catch {
      return { caption: response.text || "", tags: "" };
    }
  },

  getWADeviceStatus: () => JSON.parse(localStorage.getItem(LS_KEYS.WA_STATUS) || '{"connected": false}'),
  setWADeviceStatus: (status: any) => localStorage.setItem(LS_KEYS.WA_STATUS, JSON.stringify(status)),


  getSalesmen: async (): Promise<Salesman[]> => JSON.parse(localStorage.getItem(LS_KEYS.SALESMEN) || '[]'),
  addSalesman: async (data: any): Promise<Salesman> => {
    const current = await dbService.getSalesmen();
    const newStaff = {
      ...data,
      id: 'ST' + Date.now(),
      salesCount: 0,
      totalSalesValue: 0,
      joinDate: new Date().toISOString(),
      status: 'Available'
    };
    localStorage.setItem(LS_KEYS.SALESMEN, JSON.stringify([...current, newStaff]));
    syncToCloud('addSalesman', newStaff);
    return newStaff;
  },
  deleteSalesman: async (id: string): Promise<void> => {
    const current = await dbService.getSalesmen();
    localStorage.setItem(LS_KEYS.SALESMEN, JSON.stringify(current.filter(s => s.id !== id)));
    syncToCloud('deleteSalesman', { id });
  },



  getRecycleBin: async (): Promise<RecycleBinItem[]> => {
    const local = localStorage.getItem(LS_KEYS.RECYCLE_BIN);
    const bin: RecycleBinItem[] = local ? JSON.parse(local) : [];
    const settings = await dbService.getSettings();
    const purgeDays = settings.general.recycleBinDays || 30;
    const now = new Date().getTime();
    const filteredBin = bin.filter(item => {
      const deletedAt = new Date(item.deletedAt).getTime();
      return (now - deletedAt) < (purgeDays * 24 * 60 * 60 * 1000);
    });
    if (filteredBin.length !== bin.length) {
      localStorage.setItem(LS_KEYS.RECYCLE_BIN, JSON.stringify(filteredBin));
    }
    return filteredBin;
  },

  getRecycleBinItems: async (): Promise<RecycleBinItem[]> => dbService.getRecycleBin(),

  restoreFromRecycleBin: async (binId: string): Promise<void> => dbService.restoreFromBin(binId),

  permanentlyDelete: async (binId: string): Promise<void> => dbService.purgeFromBin(binId),

  moveToRecycleBin: async (type: RecycleBinCategory, data: any): Promise<void> => {
    const bin = await dbService.getRecycleBin();
    const newItem: RecycleBinItem = {
      binId: 'BIN-' + Date.now(),
      originalId: data.id,
      type,
      data,
      deletedAt: new Date().toISOString()
    };
    localStorage.setItem(LS_KEYS.RECYCLE_BIN, JSON.stringify([newItem, ...bin]));
  },

  restoreFromBin: async (binId: string): Promise<void> => {
    const bin = await dbService.getRecycleBin();
    const item = bin.find(i => i.binId === binId);
    if (!item) return;
    let key = '';
    switch (item.type) {
      case 'Customer': key = LS_KEYS.CUSTOMERS; break;
      case 'Invoice': key = LS_KEYS.INVOICES; break;
      case 'Complaint': key = LS_KEYS.COMPLAINTS; break;
      case 'Inventory': key = LS_KEYS.INVENTORY; break;
      case 'Expense': key = LS_KEYS.EXPENSES; break;
      case 'Visitor': key = LS_KEYS.VISITORS; break;
    }
    if (key) {
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([...current, item.data]));
    }
    // Fix: replaced 'id' with 'binId' to resolve "Cannot find name 'id'" error
    localStorage.setItem(LS_KEYS.RECYCLE_BIN, JSON.stringify(bin.filter(i => i.binId !== binId)));
  },

  purgeFromBin: async (binId: string): Promise<void> => {
    const bin = await dbService.getRecycleBin();
    localStorage.setItem(LS_KEYS.RECYCLE_BIN, JSON.stringify(bin.filter(i => i.binId !== binId)));
  },

  emptyRecycleBin: async (): Promise<void> => {
    localStorage.setItem(LS_KEYS.RECYCLE_BIN, JSON.stringify([]));
  },

  // User Management Functions
  initializeDefaultUsers: async (): Promise<void> => {
    const users = await dbService.getUsers();
    if (users.length === 0) {
      // Create default admin user
      const defaultAdmin: User = {
        id: generateUniqueId('U'),
        username: 'admin',
        password: encryptPassword('admin123'),
        role: 'admin',
        name: 'Administrator',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(LS_KEYS.USERS, JSON.stringify([defaultAdmin]));
    }
  },

  getUsers: async (): Promise<User[]> => {
    const users = JSON.parse(localStorage.getItem(LS_KEYS.USERS) || '[]');
    return users;
  },

  getUserByUsername: async (username: string): Promise<User | null> => {
    const users = await dbService.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  addUser: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const users = await dbService.getUsers();

    // Check if username already exists
    const existing = users.find(u => u.username.toLowerCase() === data.username.toLowerCase());
    if (existing) {
      throw new Error('Username already exists');
    }

    const newUser: User = {
      ...data,
      id: generateUniqueId('U'),
      password: encryptPassword(data.password),
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(LS_KEYS.USERS, JSON.stringify([...users, newUser]));
    return newUser;
  },

  updateUser: async (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> => {
    const users = await dbService.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === id) {
        const user = { ...u, ...updates };
        // If password is being updated, encrypt it
        if (updates.password) {
          user.password = encryptPassword(updates.password);
        }
        return user;
      }
      return u;
    });
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(updatedUsers));
  },

  deleteUser: async (id: string): Promise<void> => {
    const users = await dbService.getUsers();
    // Prevent deleting the last admin
    const admins = users.filter(u => u.role === 'admin');
    const userToDelete = users.find(u => u.id === id);

    if (userToDelete?.role === 'admin' && admins.length === 1) {
      throw new Error('Cannot delete the last admin user');
    }

    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users.filter(u => u.id !== id)));
  },

  toggleUserStatus: async (id: string): Promise<void> => {
    const users = await dbService.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === id) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });
    localStorage.setItem(LS_KEYS.USERS, JSON.stringify(updatedUsers));
  },

  // Payment Receipts
  getPaymentReceipts: async (): Promise<PaymentReceipt[]> => {
    const receipts = localStorage.getItem(LS_KEYS.PAYMENT_RECEIPTS);
    return receipts ? JSON.parse(receipts) : [];
  },

  addPaymentReceipt: async (data: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'createdAt'>): Promise<PaymentReceipt> => {
    const current = await dbService.getPaymentReceipts();

    // Generate receipt number with zero-padded counter
    const nextNumber = current.length + 1;
    const receiptNumber = `PR-${String(nextNumber).padStart(4, '0')}`;
    const id = `PR-${Date.now()}`;

    const newReceipt: PaymentReceipt = {
      ...data,
      id,
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(LS_KEYS.PAYMENT_RECEIPTS, JSON.stringify([newReceipt, ...current]));
    syncToCloud('addPaymentReceipt', newReceipt);

    // Create transaction entries for cash and UPI
    if (data.cashAmount > 0) {
      await dbService.addTransaction({
        entityId: data.customerId,
        accountId: 'CASH-01',
        type: 'IN',
        amount: data.cashAmount,
        paymentMode: 'Cash',
        description: `Payment Receipt ${receiptNumber} - Cash${data.description ? ` (${data.description})` : ''}`
      });
    }

    if (data.upiAmount > 0) {
      await dbService.addTransaction({
        entityId: data.customerId,
        accountId: 'WALLET-01',
        type: 'IN',
        amount: data.upiAmount,
        paymentMode: 'UPI',
        description: `Payment Receipt ${receiptNumber} - UPI${data.description ? ` (${data.description})` : ''}`
      });
    }

    return newReceipt;
  },


  getPaymentReceiptById: async (id: string): Promise<PaymentReceipt | undefined> => {
    const receipts = await dbService.getPaymentReceipts();
    return receipts.find(r => r.id === id);
  },

  deletePaymentReceipt: async (id: string): Promise<void> => {
    const receipts = await dbService.getPaymentReceipts();
    localStorage.setItem(LS_KEYS.PAYMENT_RECEIPTS, JSON.stringify(receipts.filter(r => r.id !== id)));
    syncToCloud('deletePaymentReceipt', { id });
  },

  updatePaymentReceipt: async (id: string, updates: Partial<PaymentReceipt>): Promise<void> => {
    const receipts = await dbService.getPaymentReceipts();
    const updatedReceipts = receipts.map(r => r.id === id ? { ...r, ...updates } : r);
    localStorage.setItem(LS_KEYS.PAYMENT_RECEIPTS, JSON.stringify(updatedReceipts));

    // Also try to update linked transactions if amount changed
    // This is a best-effort attempt to keep ledgers in sync
    const originalReceipt = receipts.find(r => r.id === id);
    if (originalReceipt) {
      const txns = await dbService.getTransactions();
      // Find transactions with matching description pattern
      const receiptNum = originalReceipt.receiptNumber;

      let updatedTxns = [...txns];
      let changed = false;

      // Update Cash Transaction
      if ((updates.cashAmount !== undefined && updates.cashAmount !== originalReceipt.cashAmount) || updates.date) {
        const cashTxnIndex = updatedTxns.findIndex(t => t.description.includes(receiptNum) && t.paymentMode === 'Cash');
        if (cashTxnIndex !== -1) {
          updatedTxns[cashTxnIndex] = {
            ...updatedTxns[cashTxnIndex],
            amount: updates.cashAmount !== undefined ? updates.cashAmount : updatedTxns[cashTxnIndex].amount,
            date: updates.date || updatedTxns[cashTxnIndex].date
          };
          changed = true;
        }
      }

      // Update UPI Transaction
      if ((updates.upiAmount !== undefined && updates.upiAmount !== originalReceipt.upiAmount) || updates.date) {
        const upiTxnIndex = updatedTxns.findIndex(t => t.description.includes(receiptNum) && t.paymentMode === 'UPI');
        if (upiTxnIndex !== -1) {
          updatedTxns[upiTxnIndex] = {
            ...updatedTxns[upiTxnIndex],
            amount: updates.upiAmount !== undefined ? updates.upiAmount : updatedTxns[upiTxnIndex].amount,
            date: updates.date || updatedTxns[upiTxnIndex].date
          };
          changed = true;
        }
      }

      if (changed) {
        localStorage.setItem(LS_KEYS.TRANSACTIONS, JSON.stringify(updatedTxns));
      }
    }
  },

  // ============================================
  // TALLY EXPORT & BULK DATA MANAGEMENT
  // ============================================

  /**
   * Export data to Tally XML format
   */
  exportToTallyXML: async (): Promise<string> => {
    const [invoices, expenses, settings] = await Promise.all([
      dbService.getInvoices(),
      dbService.getExpenses(),
      dbService.getSettings()
    ]);

    const companyName = settings.transaction.prefixes.firmName || 'MOTO GEAR SRK';
    const currentDate = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
`;

    // Export Sales Vouchers (Invoices)
    invoices.forEach(inv => {
      const invDate = new Date(inv.date).toISOString().split('T')[0].replace(/-/g, '');
      xml += `          <VOUCHER REMOTEID="" VCHKEY="" VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${invDate}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${inv.id}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${inv.customerName}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${inv.customerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${inv.finalAmount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${inv.finalAmount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
`;
    });

    // Export Payment Vouchers (Expenses)
    expenses.forEach(exp => {
      const expDate = new Date(exp.date).toISOString().split('T')[0].replace(/-/g, '');
      xml += `          <VOUCHER REMOTEID="" VCHKEY="" VCHTYPE="Payment" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${expDate}</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${exp.id}</VOUCHERNUMBER>
            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${exp.category}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${exp.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Cash</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${exp.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
`;
    });

    xml += `        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    return xml;
  },

  /**
   * Export data to Tally CSV format
   */
  exportToTallyCSV: async (): Promise<{ customers: string, inventory: string, invoices: string, expenses: string }> => {
    const [customers, inventory, invoices, expenses] = await Promise.all([
      dbService.getCustomers(),
      dbService.getInventory(),
      dbService.getInvoices(),
      dbService.getExpenses()
    ]);

    // Customers CSV
    let customersCSV = 'Name,Phone,Bike Number,City,GSTIN,Opening Balance\n';
    customers.forEach(c => {
      customersCSV += `"${c.name}","${c.phone}","${c.bikeNumber}","${c.city || ''}","${c.gstin || ''}",0\n`;
    });

    // Inventory CSV
    let inventoryCSV = 'Item Name,Category,Stock,Unit Price,Purchase Price,Item Code,GST Rate,HSN\n';
    inventory.forEach(i => {
      inventoryCSV += `"${i.name}","${i.category}",${i.stock},${i.unitPrice},${i.purchasePrice},"${i.itemCode}",${i.gstRate || 0},"${i.hsn || ''}"\n`;
    });

    // Invoices CSV
    let invoicesCSV = 'Invoice No,Date,Customer Name,Bike Number,Total Amount,Tax Amount,Payment Status\n';
    invoices.forEach(inv => {
      const date = new Date(inv.date).toISOString().split('T')[0];
      invoicesCSV += `"${inv.id}","${date}","${inv.customerName}","${inv.bikeNumber}",${inv.finalAmount},${inv.taxAmount || 0},"${inv.paymentStatus}"\n`;
    });

    // Expenses CSV
    let expensesCSV = 'Expense ID,Date,Description,Category,Amount,Payment Mode\n';
    expenses.forEach(exp => {
      const date = new Date(exp.date).toISOString().split('T')[0];
      expensesCSV += `"${exp.id}","${date}","${exp.description}","${exp.category}",${exp.amount},"${exp.paymentMode}"\n`;
    });

    return { customers: customersCSV, inventory: inventoryCSV, invoices: invoicesCSV, expenses: expensesCSV };
  },

  /**
   * Export all data to Excel-compatible CSV
   */
  exportAllDataToExcel: async (): Promise<string> => {
    const [customers, inventory, invoices, expenses, complaints, transactions] = await Promise.all([
      dbService.getCustomers(),
      dbService.getInventory(),
      dbService.getInvoices(),
      dbService.getExpenses(),
      dbService.getComplaints(),
      dbService.getTransactions()
    ]);

    let csv = 'MOTO GEAR SRK - Complete Data Export\n';
    csv += `Export Date: ${new Date().toISOString()}\n\n`;

    // Customers Section
    csv += '=== CUSTOMERS ===\n';
    csv += 'ID,Name,Phone,Bike Number,City,Email,GSTIN,Loyalty Points,Created At\n';
    customers.forEach(c => {
      csv += `"${c.id}","${c.name}","${c.phone}","${c.bikeNumber}","${c.city || ''}","${c.email || ''}","${c.gstin || ''}",${c.loyaltyPoints},"${c.createdAt}"\n`;
    });

    csv += '\n=== INVENTORY ===\n';
    csv += 'ID,Item Name,Category,Stock,Unit Price,Purchase Price,Item Code,GST Rate,HSN,Last Updated\n';
    inventory.forEach(i => {
      csv += `"${i.id}","${i.name}","${i.category}",${i.stock},${i.unitPrice},${i.purchasePrice},"${i.itemCode}",${i.gstRate || 0},"${i.hsn || ''}","${i.lastUpdated}"\n`;
    });

    csv += '\n=== INVOICES ===\n';
    csv += 'ID,Date,Customer Name,Bike Number,Phone,Details,Total Amount,Tax,Payment Status,Payment Mode\n';
    invoices.forEach(inv => {
      csv += `"${inv.id}","${inv.date}","${inv.customerName}","${inv.bikeNumber}","${inv.customerPhone || ''}","${inv.details}",${inv.finalAmount},${inv.taxAmount || 0},"${inv.paymentStatus}","${inv.paymentMode}"\n`;
    });

    csv += '\n=== EXPENSES ===\n';
    csv += 'ID,Date,Description,Category,Amount,Payment Mode\n';
    expenses.forEach(exp => {
      csv += `"${exp.id}","${exp.date}","${exp.description}","${exp.category}",${exp.amount},"${exp.paymentMode}"\n`;
    });

    return csv;
  },

  /**
   * Get CSV templates for bulk import
   */
  getImportTemplates: (): { customers: string, inventory: string, invoices: string } => {
    const customersTemplate = 'Name,Phone,Bike Number,City,Email,GSTIN\n' +
      '"John Doe","9876543210","DL01AB1234","Delhi","john@example.com","29ABCDE1234F1Z5"\n' +
      '"Jane Smith","9876543211","DL02CD5678","Noida","",""\n';

    const inventoryTemplate = 'Item Name,Category,Stock,Unit Price,Purchase Price,Item Code,GST Rate,HSN\n' +
      '"Engine Oil","Lubricants",50,450,350,"EO-001",18,"27101980"\n' +
      '"Brake Pad","Spare Parts",30,800,600,"BP-002",18,"87083010"\n';

    const invoicesTemplate = 'Customer Name,Bike Number,Phone,Details,Item Description,Item Amount,Payment Status\n' +
      '"John Doe","DL01AB1234","9876543210","Regular Service","Oil Change,500","Paid"\n';

    return { customers: customersTemplate, inventory: inventoryTemplate, invoices: invoicesTemplate };
  },

  /**
   * Validate and parse CSV data for bulk import
   */
  validateCSVImport: async (csvData: string, type: 'customers' | 'inventory'): Promise<{ valid: boolean, errors: string[], data: any[] }> => {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return { valid: false, errors: ['CSV file is empty or has no data rows'], data: [] };
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const errors: string[] = [];
    const data: any[] = [];

    if (type === 'customers') {
      const requiredHeaders = ['Name', 'Phone', 'Bike Number'];
      const missing = requiredHeaders.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        return { valid: false, errors: [`Missing required columns: ${missing.join(', ')}`], data: [] };
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];

        const name = values[headers.indexOf('Name')] || '';
        const phone = values[headers.indexOf('Phone')] || '';
        const bikeNumber = values[headers.indexOf('Bike Number')] || '';

        if (!name || !phone || !bikeNumber) {
          errors.push(`Row ${i + 1}: Missing required fields (Name, Phone, or Bike Number)`);
          continue;
        }

        data.push({
          name,
          phone,
          bikeNumber: bikeNumber.toUpperCase(),
          city: values[headers.indexOf('City')] || '',
          email: values[headers.indexOf('Email')] || '',
          gstin: values[headers.indexOf('GSTIN')] || ''
        });
      }
    } else if (type === 'inventory') {
      const requiredHeaders = ['Item Name', 'Category', 'Stock', 'Unit Price'];
      const missing = requiredHeaders.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        return { valid: false, errors: [`Missing required columns: ${missing.join(', ')}`], data: [] };
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];

        const name = values[headers.indexOf('Item Name')] || '';
        const category = values[headers.indexOf('Category')] || '';
        const stock = parseFloat(values[headers.indexOf('Stock')] || '0');
        const unitPrice = parseFloat(values[headers.indexOf('Unit Price')] || '0');

        if (!name || !category) {
          errors.push(`Row ${i + 1}: Missing Item Name or Category`);
          continue;
        }

        if (isNaN(stock) || isNaN(unitPrice)) {
          errors.push(`Row ${i + 1}: Invalid numeric values for Stock or Unit Price`);
          continue;
        }

        data.push({
          name,
          category,
          stock,
          unitPrice,
          purchasePrice: parseFloat(values[headers.indexOf('Purchase Price')] || '0'),
          itemCode: values[headers.indexOf('Item Code')] || '',
          gstRate: parseFloat(values[headers.indexOf('GST Rate')] || '0'),
          hsn: values[headers.indexOf('HSN')] || ''
        });
      }
    }

    return { valid: errors.length === 0, errors, data };
  },

  /**
   * Bulk import customers from validated data
   */
  bulkImportCustomers: async (customersData: any[]): Promise<{ imported: number, skipped: number }> => {
    const existingCustomers = await dbService.getCustomers();
    let imported = 0;
    let skipped = 0;

    for (const customerData of customersData) {
      // Check if customer already exists by bike number
      const exists = existingCustomers.find(c => c.bikeNumber.toUpperCase() === customerData.bikeNumber.toUpperCase());

      if (exists) {
        skipped++;
        continue;
      }

      await dbService.addCustomer(customerData);
      imported++;
    }

    return { imported, skipped };
  },

  // ============================================
  // GOOGLE SHEETS CLOUD SYNC
  // ============================================

  /** Check if cloud sync is configured */
  isCloudEnabled,

  /** Get the current Google Apps Script URL */
  getGasUrl,

  /** Set the Google Apps Script web app URL */
  setGasUrl: (url: string): void => {
    localStorage.setItem(GAS_URL_KEY, url);
  },

  /** One-time migration: push all localStorage data to Google Sheets */
  migrateToCloud,

  /** 
   * Pull all data FROM Google Sheets INTO localStorage (cloud → local).
   * Use this to sync a new device with existing cloud data.
   */
  pullFromCloud: async (): Promise<string> => {
    if (!isCloudEnabled()) return 'Cloud not configured';

    const pulls = [
      { action: 'getCustomers', key: LS_KEYS.CUSTOMERS },
      { action: 'getInvoices', key: LS_KEYS.INVOICES },
      { action: 'getInventory', key: LS_KEYS.INVENTORY },
      { action: 'getTransactions', key: LS_KEYS.TRANSACTIONS },
      { action: 'getExpenses', key: LS_KEYS.EXPENSES },
      { action: 'getBankAccounts', key: LS_KEYS.BANK_ACCOUNTS },
      { action: 'getPaymentReceipts', key: LS_KEYS.PAYMENT_RECEIPTS },
      { action: 'getComplaints', key: LS_KEYS.COMPLAINTS },
      { action: 'getStockWanting', key: LS_KEYS.STOCK_WANTING },
      { action: 'getVisitors', key: LS_KEYS.VISITORS },
      { action: 'getReminders', key: LS_KEYS.REMINDERS },
      { action: 'getUsers', key: LS_KEYS.USERS },
      { action: 'getSalesmen', key: LS_KEYS.SALESMEN },
    ];

    const results: string[] = [];
    for (const { action, key } of pulls) {
      try {
        const data = await fetchFromCloud(action);
        if (data && Array.isArray(data)) {
          localStorage.setItem(key, JSON.stringify(data));
          results.push(`✅ ${action}: ${data.length} items`);
        } else {
          results.push(`⚠️ ${action}: no data`);
        }
      } catch (err: any) {
        results.push(`❌ ${action}: ${err.message}`);
      }
    }

    // Pull settings
    try {
      const settings = await fetchFromCloud('getConfig', { key: 'app_settings' });
      if (settings) {
        localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(settings));
        results.push('✅ Settings pulled');
      }
    } catch { results.push('⚠️ Settings: skipped'); }

    return `Cloud sync complete!\n\n${results.join('\n')}`;
  },

  /**
   * Sync a single entity write to the cloud in background.
   * This is called internally by write operations when cloud is enabled.
   */
  syncToCloud,

};
