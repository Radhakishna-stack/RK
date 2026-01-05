

import { Customer, Complaint, Invoice, Transaction, InventoryItem, Expense, ComplaintStatus, DashboardStats, ServiceReminder, AdSuggestion, AppSettings } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const isGAS = typeof window !== 'undefined' && (window as any).google?.script?.run;

const LS_KEYS = {
  CUSTOMERS: 'bp_customers',
  COMPLAINTS: 'bp_complaints',
  INVOICES: 'bp_invoices',
  INVENTORY: 'bp_inventory',
  EXPENSES: 'bp_expenses',
  TRANSACTIONS: 'bp_transactions',
  REMINDERS: 'bp_reminders',
  SETTINGS: 'bp_settings'
};

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    passcodeEnabled: false,
    passcode: '',
    currency: '₹',
    decimalPlaces: 2,
    stopNegativeStock: true,
    blockNewItems: false,
    features: {
      estimates: true,
      proforma: false,
      orders: false,
      challan: true,
      fixedAssets: false,
    },
    multiFirm: false,
    auditTrail: true,
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
    shareTransactionAs: 'Ask me Everytime',
    passcodeEditDelete: false,
    discountDuringPayment: false,
    linkPaymentsToInvoices: true,
    dueDatesAndTerms: true,
    enableInvoicePreview: true,
    showProfit: false,
    additionalFields: false,
    transportationDetails: false,
    additionalCharges: false,
    prefixes: {
      firmName: 'SRK BIKE SERVICE',
      sale: 'INV-',
      estimate: 'EST-',
      creditNote: 'CN-',
      saleOrder: 'None',
      purchaseOrder: 'SBS-',
      paymentIn: 'PI-'
    },
  },
  print: {
    printerType: 'Regular',
    theme: 'GST Theme 1',
    showCompanyName: true,
    showLogo: true,
    showAddress: true,
    showEmail: true,
    paperSize: 'A4',
  },
  gst: {
    enabled: true,
    showHsn: true,
    rcm: false,
    placeOfSupply: true,
    composite: false,
    reverseCharge: false,
    stateOfSupply: true,
    ewayBill: false
  },
  messages: {
    channel: 'WhatsApp',
    sendToParty: true,
    copyToSelf: false,
    template: 'Hi {{CustomerName}}, your bill of {{InvoiceAmount}} for bike {{BikeNumber}} is ready. Balance: {{Balance}}.',
  },
  party: {
    gstin: true,
    grouping: false,
    shippingAddress: true,
    loyaltyPoints: true,
    paymentReminders: true,
    reminderOffset: 3,
    additionalFields: [
      { label: 'GSTIN', showOnPrint: true },
      { label: 'DL Number', showOnPrint: true }
    ],
  },
  item: {
    isProduct: true,
    stockMaintenance: true,
    serialTracking: false,
    batchTracking: false,
    mrpColumn: true,
  },
  reminders: {
    enabled: true,
    autoSchedule: true,
    defaultInterval: '3 Months',
    reminderTemplate: 'Hello {{CustomerName}}, your bike {{BikeNumber}} is due for service. Visit Moto Gear SRK today!',
  },
  accounting: {
    enabled: false,
    allowJournalEntries: false,
  },
};

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

const runGAS = async (funcName: string, ...args: any[]): Promise<any> => {
  // If running inside Google Apps Script (as a web app)
  if (isGAS) {
    return new Promise((resolve, reject) => {
      (window as any).google.script.run
        .withSuccessHandler((data: any) => {
          if (Array.isArray(data)) {
            resolve(data.filter(item => item !== null));
          } else {
            resolve(data);
          }
        })
        .withFailureHandler(reject)[funcName](...args);
    });
  }

  // If running locally but a remote GAS URL is provided
  if (GAS_URL) {
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script web apps require no-cors or redirect handling
        body: JSON.stringify({
          action: funcName,
          args: args
        })
      });
      // Note: 'no-cors' mode results in an opaque response, we can't read the result easily.
      // For a real API, a better way is required, but this is a starting point.
      // Alternatively, we use JSONP or a proxy.
      console.log(`Sent ${funcName} to remote GAS`);
      return null;
    } catch (e) {
      console.error("Remote GAS Error", e);
      return null;
    }
  }

  return null;
};

export const dbService = {
  getConnectionStatus: () => isGAS ? 'connected' : 'preview',

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const gasData = await runGAS('getSettings');
    if (gasData) return gasData;
    const local = localStorage.getItem(LS_KEYS.SETTINGS);
    return local ? JSON.parse(local) : DEFAULT_SETTINGS;
  },
  updateSettings: async (settings: AppSettings): Promise<void> => {
    await runGAS('updateSettings', settings);
    localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // WhatsApp
  sendWhatsApp: (phone: string, message: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${formattedPhone.length === 10 ? '91' + formattedPhone : formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  // AI Ads Manager
  getAdSuggestions: async (businessName: string): Promise<AdSuggestion[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 professional and high-converting social media ad suggestions for a bike service center named "${businessName}".`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING, description: 'Platform (e.g., Instagram/Facebook)' },
              headline: { type: Type.STRING },
              copy: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              estimatedPerformance: { type: Type.STRING, description: 'Brief reasoning for the ad effectiveness' }
            },
            required: ['platform', 'headline', 'copy', 'targetAudience', 'estimatedPerformance']
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("AI Parse Error", e);
      return [];
    }
  },

  // Reminders
  getReminders: async (): Promise<ServiceReminder[]> => {
    const gasData = await runGAS('getReminders');
    if (gasData) return gasData;
    return JSON.parse(localStorage.getItem(LS_KEYS.REMINDERS) || '[]');
  },
  addReminder: async (reminder: Omit<ServiceReminder, 'id' | 'status'>): Promise<ServiceReminder> => {
    const gasResult = await runGAS('createReminder', reminder);
    if (gasResult) return gasResult;
    const reminders = await dbService.getReminders();
    const newRem: ServiceReminder = { ...reminder, id: 'L-REM-' + Date.now(), status: 'Pending' };
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify([...reminders, newRem]));
    return newRem;
  },
  deleteReminder: async (id: string): Promise<void> => {
    await runGAS('deleteReminder', id);
    const items = await dbService.getReminders();
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify(items.filter(i => i.id !== id)));
  },

  // Core Data methods
  getCustomers: async (): Promise<Customer[]> => {
    const gasData = await runGAS('getCustomers');
    if (gasData) return gasData;
    return JSON.parse(localStorage.getItem(LS_KEYS.CUSTOMERS) || '[]');
  },
  addCustomer: async (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt'>): Promise<Customer> => {
    const gasResult = await runGAS('createCustomer', customer);
    if (gasResult) return gasResult;
    const customers = await dbService.getCustomers();
    const newCustomer: Customer = { ...customer, id: 'L-CUST-' + Date.now(), loyaltyPoints: 0, createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify([...customers, newCustomer]));
    return newCustomer;
  },
  deleteCustomer: async (id: string): Promise<void> => {
    await runGAS('deleteCustomer', id);
    const items = await dbService.getCustomers();
    localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify(items.filter(i => i.id !== id)));
  },

  getComplaints: async (): Promise<Complaint[]> => {
    const gasData = await runGAS('getComplaints');
    if (gasData) return gasData;
    return JSON.parse(localStorage.getItem(LS_KEYS.COMPLAINTS) || '[]');
  },
  addComplaint: async (complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>): Promise<Complaint> => {
    const gasResult = await runGAS('createComplaint', complaint);
    if (gasResult) return gasResult;
    const complaints = await dbService.getComplaints();
    const newComp: Complaint = { ...complaint, id: 'L-CMP-' + Date.now(), status: ComplaintStatus.PENDING, createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify([...complaints, newComp]));
    return newComp;
  },
  deleteComplaint: async (id: string): Promise<void> => {
    await runGAS('deleteComplaint', id);
    const items = await dbService.getComplaints();
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(items.filter(i => i.id !== id)));
  },
  updateComplaintStatus: async (id: string, status: ComplaintStatus): Promise<void> => {
    const gasResult = await runGAS('updateComplaintStatus', id, status);
    if (gasResult !== null) return;
    const complaints = await dbService.getComplaints();
    const updated = complaints.map(c => c.id === id ? { ...c, status } : c);
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(updated));
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const gasData = await runGAS('getInvoices');
    if (gasData) return gasData;
    return JSON.parse(localStorage.getItem(LS_KEYS.INVOICES) || '[]');
  },
  generateInvoice: async (invoiceData: Omit<Invoice, 'id' | 'date'>): Promise<Invoice> => {
    const gasResult = await runGAS('generateInvoice', invoiceData);
    if (gasResult) return gasResult;
    const invoices = await dbService.getInvoices();
    const newInv: Invoice = { ...invoiceData, id: 'L-INV-' + Date.now(), date: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify([...invoices, newInv]));
    return newInv;
  },
  deleteInvoice: async (id: string): Promise<void> => {
    await runGAS('deleteInvoice', id);
    const items = await dbService.getInvoices();
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify(items.filter(i => i.id !== id)));
  },

  getInventory: async (): Promise<InventoryItem[]> => {
    const gasData = await runGAS('getInventory');
    if (gasData) return gasData;
    return JSON.parse(localStorage.getItem(LS_KEYS.INVENTORY) || '[]');
  },
  addInventoryItem: async (item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> => {
    const gasResult = await runGAS('addInventoryItem', item);
    if (gasResult) return gasResult;
    const inventory = await dbService.getInventory();
    const newItem: InventoryItem = { ...item, id: 'L-SKU-' + Date.now(), lastUpdated: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify([...inventory, newItem]));
    return newItem;
  },
  deleteInventoryItem: async (id: string): Promise<void> => {
    await runGAS('deleteInventoryItem', id);
    const items = await dbService.getInventory();
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(items.filter(i => i.id !== id)));
  },
  updateStock: async (id: string, delta: number) => {
    const gasResult = await runGAS('updateStock', id, delta);
    if (gasResult !== null) return;
    const inventory = await dbService.getInventory();
    const updated = inventory.map(i => i.id === id ? { ...i, stock: i.stock + delta, lastUpdated: new Date().toISOString() } : i);
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(updated));
  },

  getExpenses: async (): Promise<Expense[]> => {
    const gasData = await runGAS('getExpenses');
    if (gasData) return gasData;
    return JSON.parse(localStorage.getItem(LS_KEYS.EXPENSES) || '[]');
  },
  addExpense: async (expense: Omit<Expense, 'id' | 'date'>): Promise<Expense> => {
    const gasResult = await runGAS('addExpense', expense);
    if (gasResult) return gasResult;
    const expenses = await dbService.getExpenses();
    const newExp: Expense = { ...expense, id: 'L-EXP-' + Date.now(), date: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify([...expenses, newExp]));
    return newExp;
  },
  deleteExpense: async (id: string): Promise<void> => {
    await runGAS('deleteExpense', id);
    const items = await dbService.getExpenses();
    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(items.filter(i => i.id !== id)));
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const gasData = await runGAS('getDashboardStats');
    if (gasData) return gasData;
    const customers = await dbService.getCustomers();
    const complaints = await dbService.getComplaints();
    const invoices = await dbService.getInvoices();
    const expenses = await dbService.getExpenses();
    const received = invoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, i) => sum + i.finalAmount, 0);
    const pending = invoices.filter(i => i.paymentStatus === 'Unpaid').reduce((sum, i) => sum + i.finalAmount, 0);
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const cash = invoices.filter(i => i.paymentMode === 'Cash' && i.paymentStatus === 'Paid').reduce((sum, i) => sum + i.finalAmount, 0) - expenses.filter(e => e.paymentMode === 'Cash').reduce((sum, e) => sum + e.amount, 0);
    const bank = received - cash;
    return {
      totalCustomers: customers.length,
      totalComplaints: complaints.length,
      totalInvoices: invoices.length,
      totalReceived: received,
      totalPending: pending,
      totalExpenses: spent,
      netProfit: received - spent,
      cashInHand: Math.max(0, cash),
      bankBalance: Math.max(0, bank)
    };
  }
};