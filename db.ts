

import { Customer, Visitor, Complaint, Invoice, InvoiceItem, InventoryItem, Expense, ComplaintStatus, DashboardStats, ServiceReminder, AdSuggestion, AppSettings, StockTransaction, Salesman, PickupBooking, PickupSlot, StaffLocation, PickupStatus, StockWantingItem, RecycleBinItem, RecycleBinCategory, Transaction, BankAccount, User, UserRole, PaymentReceipt } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { encryptPassword } from './auth';

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
  STOCK_TXNS: 'mg_stock_txns',
  TRANSACTIONS: 'mg_transactions',
  SALESMEN: 'mg_salesmen',
  PICKUP_BOOKINGS: 'mg_pickups',
  PICKUP_SLOTS: 'mg_slots',
  WA_STATUS: 'mg_wa_status',
  STAFF_LOCS: 'mg_staff_locs',
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
    return newBank;
  },

  deleteBankAccount: async (id: string): Promise<void> => {
    if (id === 'CASH-01') throw new Error("Cannot delete primary Cash account");
    const current = await dbService.getBankAccounts();
    localStorage.setItem(LS_KEYS.BANK_ACCOUNTS, JSON.stringify(current.filter(b => b.id !== id)));
  },

  getAccountBalance: async (accountId: string): Promise<number> => {
    const accounts = await dbService.getBankAccounts();
    const target = accounts.find(a => a.id === accountId);
    if (!target) return 0;

    const txns = await dbService.getTransactions();
    const accountTxns = txns.filter(t => t.accountId === accountId);

    const flow = accountTxns.reduce((sum, t) => t.type === 'IN' ? sum + t.amount : sum - t.amount, 0);
    return target.openingBalance + flow;
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
  resolveLocationViaAI: async (text: string): Promise<{ lat: number, lng: number, address: string } | { error: string } | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      // Specific detection for Rate Limit / Quota Exhaustion
      if (e?.message?.includes('429') || e?.message?.includes('RESOURCE_EXHAUSTED')) {
        return { error: 'QUOTA_EXCEEDED' };
      }
      return null;
    }
  },

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
    return newTxn;
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const transactions = await dbService.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      localStorage.setItem(LS_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
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
    return newVisitor;
  },
  deleteVisitor: async (id: string): Promise<void> => {
    const current = await dbService.getVisitors();
    const itemToDelete = current.find(v => v.id === id);
    if (itemToDelete) {
      await dbService.moveToRecycleBin('Visitor', itemToDelete);
      localStorage.setItem(LS_KEYS.VISITORS, JSON.stringify(current.filter(v => v.id !== id)));
    }
  },

  getStockWanting: async (): Promise<StockWantingItem[]> => JSON.parse(localStorage.getItem(LS_KEYS.STOCK_WANTING) || '[]'),
  addStockWantingItem: async (data: Omit<StockWantingItem, 'id' | 'createdAt'>): Promise<StockWantingItem> => {
    const current = await dbService.getStockWanting();
    const newItem = { ...data, id: 'W' + Date.now(), createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.STOCK_WANTING, JSON.stringify([...current, newItem]));
    return newItem;
  },
  deleteStockWantingItem: async (id: string): Promise<void> => {
    const current = await dbService.getStockWanting();
    localStorage.setItem(LS_KEYS.STOCK_WANTING, JSON.stringify(current.filter(i => i.id !== id)));
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
    return newComplaint;
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
  updateInvoicePaymentStatus: async (id: string, status: 'Paid' | 'Pending' | 'Unpaid'): Promise<void> => {
    const current = await dbService.getInvoices();
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify(current.map(i => i.id === id ? { ...i, paymentStatus: status } : i)));
  },
  deleteInvoice: async (id: string): Promise<void> => {
    const current = await dbService.getInvoices();
    const itemToDelete = current.find(i => i.id === id);
    if (itemToDelete) {
      await dbService.moveToRecycleBin('Invoice', itemToDelete);
      localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify(current.filter(i => i.id !== id)));
    }
  },

  getInventory: async (): Promise<InventoryItem[]> => JSON.parse(localStorage.getItem(LS_KEYS.INVENTORY) || '[]'),
  addInventoryItem: async (data: any): Promise<InventoryItem> => {
    const current = await dbService.getInventory();
    const newItem = { ...data, id: 'S' + Date.now(), lastUpdated: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify([...current, newItem]));
    return newItem;
  },
  bulkUpdateInventory: async (updates: Partial<InventoryItem>[]): Promise<{ updated: number, created: number }> => {
    const current = await dbService.getInventory();
    let updatedCount = 0;
    let createdCount = 0;

    const updatedInventory = [...current];

    for (const update of updates) {
      // Use itemCode as primary key for bulk updates
      const index = updatedInventory.findIndex(i => i.itemCode === update.itemCode);
      if (index !== -1) {
        updatedInventory[index] = { ...updatedInventory[index], ...update, lastUpdated: new Date().toISOString() };
        updatedCount++;
      } else {
        // Option: Create if not exists
        const newItem: InventoryItem = {
          id: 'S' + Date.now() + Math.random().toString(36).substr(2, 5),
          name: update.name || 'NEW ITEM',
          category: update.category || 'MISC',
          stock: update.stock || 0,
          unitPrice: update.unitPrice || 0,
          purchasePrice: update.purchasePrice || 0,
          itemCode: update.itemCode || '',
          gstRate: update.gstRate || 0,
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
    }
  },
  updateStock: async (id: string, delta: number, note: string): Promise<void> => {
    const inv = await dbService.getInventory();
    const updated = inv.map(i => i.id === id ? { ...i, stock: i.stock + delta, lastUpdated: new Date().toISOString() } : i);
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(updated));
    const txns = JSON.parse(localStorage.getItem(LS_KEYS.STOCK_TXNS) || '[]');
    txns.push({ id: 'T' + Date.now(), itemId: id, type: delta > 0 ? 'IN' : 'OUT', quantity: Math.abs(delta), date: new Date().toISOString(), note });
    localStorage.setItem(LS_KEYS.STOCK_TXNS, JSON.stringify(txns));
  },
  getStockTransactions: async (itemId: string): Promise<StockTransaction[]> => {
    const txns = JSON.parse(localStorage.getItem(LS_KEYS.STOCK_TXNS) || '[]');
    return txns.filter((t: any) => t.itemId === itemId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getExpenses: async (): Promise<Expense[]> => JSON.parse(localStorage.getItem(LS_KEYS.EXPENSES) || '[]'),
  addExpense: async (data: any): Promise<Expense> => {
    const current = await dbService.getExpenses();
    const newExp = { ...data, id: 'E' + Date.now(), date: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify([newExp, ...current]));
    return newExp;
  },
  deleteExpense: async (id: string): Promise<void> => {
    const current = await dbService.getExpenses();
    const itemToDelete = current.find(e => e.id === id);
    if (itemToDelete) {
      await dbService.moveToRecycleBin('Expense', itemToDelete);
      localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(current.filter(e => e.id !== id)));
    }
  },

  getReminders: async (): Promise<ServiceReminder[]> => JSON.parse(localStorage.getItem(LS_KEYS.REMINDERS) || '[]'),
  addReminder: async (data: any): Promise<ServiceReminder> => {
    const current = await dbService.getReminders();
    const newRem = { ...data, id: 'R' + Date.now(), status: 'Pending' };
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify([...current, newRem]));
    return newRem;
  },
  updateReminderStatus: async (id: string, status: 'Pending' | 'Sent'): Promise<void> => {
    const current = await dbService.getReminders();
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify(current.map(r => r.id === id ? { ...r, status, lastNotified: new Date().toISOString() } : r)));
  },
  deleteReminder: async (id: string): Promise<void> => {
    const current = await dbService.getReminders();
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify(current.filter(r => r.id !== id)));
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
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

    let cashBal = 0;
    let bankBal = 0;

    for (const acc of accounts) {
      const balance = await dbService.getAccountBalance(acc.id);
      if (acc.type === 'Cash') cashBal += balance;
      else bankBal += balance;
    }

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
  },

  getAdSuggestions: async (businessName: string): Promise<AdSuggestion[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 professional motor bike service advertisements for "${businessName}". 
      Focus on high-performance bikes like Royal Enfield, KTM, and Hero/Honda commuters. 
      Services to highlight: Ceramic Coating, Full Engine Overhaul, Computerized Scan, and Rider Safety Checks. 
      Format for Instagram/Facebook with technical yet catchy copy.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              headline: { type: Type.STRING },
              copy: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              estimatedPerformance: { type: Type.STRING },
            },
            required: ["platform", "headline", "copy", "targetAudience", "estimatedPerformance"],
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || '[]');
    } catch {
      return [];
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

  getPickupBookings: async (): Promise<PickupBooking[]> => JSON.parse(localStorage.getItem(LS_KEYS.PICKUP_BOOKINGS) || '[]'),
  addPickupBooking: async (data: any): Promise<PickupBooking> => {
    const current = await dbService.getPickupBookings();
    const newBooking = { ...data, id: 'B' + Date.now(), status: PickupStatus.SCHEDULED, createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.PICKUP_BOOKINGS, JSON.stringify([...current, newBooking]));

    if (data.slotId) {
      const slots = await dbService.getPickupSlots();
      const updated = slots.map(s => s.id === data.slotId ? { ...s, bookedCount: s.bookedCount + 1 } : s);
      localStorage.setItem(LS_KEYS.PICKUP_SLOTS, JSON.stringify(updated));
    }
    return newBooking;
  },
  updatePickupStatus: async (id: string, status: PickupStatus, staffId?: string, staffName?: string): Promise<void> => {
    const current = await dbService.getPickupBookings();
    localStorage.setItem(LS_KEYS.PICKUP_BOOKINGS, JSON.stringify(current.map(b => b.id === id ? { ...b, status, staffId, staffName } : b)));

    if (staffId) {
      const salesmen = await dbService.getSalesmen();
      localStorage.setItem(LS_KEYS.SALESMEN, JSON.stringify(salesmen.map(s => s.id === staffId ? { ...s, status: status === PickupStatus.DELIVERED ? 'Available' : 'On Task' } : s)));
    }
  },

  getPickupSlots: async (): Promise<PickupSlot[]> => JSON.parse(localStorage.getItem(LS_KEYS.PICKUP_SLOTS) || '[]'),
  getSlotsByDate: async (date: string): Promise<PickupSlot[]> => {
    const slots = await dbService.getPickupSlots();
    return slots.filter(s => s.date === date);
  },
  initSlotsForDate: async (date: string, capacity: number): Promise<void> => {
    const current = await dbService.getPickupSlots();
    const filtered = current.filter(s => s.date !== date);
    const timeRanges = ["9-11", "11-1", "2-4", "4-6"];
    const newSlots = timeRanges.map((tr, i) => ({
      id: `S-${date}-${i}`,
      date,
      timeRange: tr,
      capacity,
      bookedCount: 0
    }));
    localStorage.setItem(LS_KEYS.PICKUP_SLOTS, JSON.stringify([...filtered, ...newSlots]));
  },

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
    return newStaff;
  },
  deleteSalesman: async (id: string): Promise<void> => {
    const current = await dbService.getSalesmen();
    localStorage.setItem(LS_KEYS.SALESMEN, JSON.stringify(current.filter(s => s.id !== id)));
  },

  getLiveStaffTracking: async (bookingId: string): Promise<StaffLocation | null> => {
    const locs: Record<string, StaffLocation> = JSON.parse(localStorage.getItem(LS_KEYS.STAFF_LOCS) || '{}');
    return locs[bookingId] || null;
  },
  updateStaffLocation: async (loc: StaffLocation): Promise<void> => {
    const locs: Record<string, StaffLocation> = JSON.parse(localStorage.getItem(LS_KEYS.STAFF_LOCS) || '{}');
    locs[loc.bookingId] = loc;
    localStorage.setItem(LS_KEYS.STAFF_LOCS, JSON.stringify(locs));
  },

  parseLocationFromLink: (text: string): { lat: number, lng: number, address?: string } | null => {
    if (!text) return null;

    // Normalize input
    const cleanText = text.replace(/["']/g, '').trim();

    // 1. Direct coordinates (18.52, 73.85)
    const directRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const directMatch = cleanText.match(directRegex);
    if (directMatch) return { lat: parseFloat(directMatch[1]), lng: parseFloat(directMatch[2]) };

    // 2. Google Maps Desktop (@lat,lng)
    const desktopRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const desktopMatch = cleanText.match(desktopRegex);
    if (desktopMatch) return { lat: parseFloat(desktopMatch[1]), lng: parseFloat(desktopMatch[2]) };

    // 3. Expanded Query Pattern (q= or query= or ll= or search/)
    const queryRegex = /[?&/](q|query|ll|search\/)(=?)(-?\d+\.\d+),(-?\d+\.\d+)/;
    const queryMatch = cleanText.match(queryRegex);
    if (queryMatch) return { lat: parseFloat(queryMatch[3]), lng: parseFloat(queryMatch[4]) };

    // 4. Place/Dir Pattern (/place/lat,lng or /dir/lat,lng)
    const placeRegex = /\/(place|dir)\/(-?\d+\.\d+),(-?\d+\.\d+)/;
    const placeMatch = cleanText.match(placeRegex);
    if (placeMatch) return { lat: parseFloat(placeMatch[2]), lng: parseFloat(placeMatch[3]) };

    // 5. Street View pattern (cbll=lat,lng)
    const streetRegex = /[?&]cbll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const streetMatch = cleanText.match(streetRegex);
    if (streetMatch) return { lat: parseFloat(streetMatch[1]), lng: parseFloat(streetMatch[2]) };

    return null;
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
  }
};
