
import { Customer, Complaint, Invoice, Transaction, InventoryItem, Expense, ComplaintStatus, DashboardStats, ServiceReminder, AdSuggestion, AppSettings, StockTransaction, Salesman, PickupBooking, PickupSlot, StaffLocation, PickupStatus } from './types';
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
  SETTINGS: 'bp_settings',
  STOCK_TRANSACTIONS: 'bp_stock_txns',
  SALESMEN: 'bp_salesmen',
  PICKUP_BOOKINGS: 'bp_pickup_bookings',
  LIVE_TRACKING: 'bp_live_tracking',
  WA_DEVICE_STATUS: 'bp_wa_status',
  PICKUP_SLOTS: 'bp_pickup_slots'
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
    textSize: 'Medium',
    pageSize: 'A4 (210 x 297 mm)',
    orientation: 'Portrait',
    showUnsavedWarning: true,
    showCompanyName: true,
    companyNameSize: 'Large',
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
    amountInWordsFormat: 'Indian (e.g. 1,00,000)',
    showYouSaved: false,
    printDescription: true,
    printReceivedBy: true,
    printDeliveredBy: false,
    printSignatureText: false,
    customSignatureText: '',
    printPaymentMode: false,
    printAcknowledgement: false,
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
    template: 'Hi {{CustomerName}}, your bill of {{InvoiceAmount}} for bike {{BikeNumber}} is ready at Moto Gear SRK. Ride safe!',
    transactionMessaging: {
      sendToParty: true,
      smsCopyToSelf: false,
      txnUpdateSms: false,
      showPartyBalance: false,
      showWebInvoiceLink: false,
      autoShareVyapar: false,
      autoMsgTypes: {
        sale: true,
        purchase: false,
        saleReturn: false,
        purchaseReturn: false,
        estimate: false,
        proforma: false,
        paymentIn: false,
        paymentOut: false,
        saleOrder: true,
        purchaseOrder: false,
        deliveryChallan: false,
        cancelledInvoice: false
      }
    }
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
    manualDateSelection: true,
    defaultInterval: '3 Months',
    reminderTemplate: 'Hello {{CustomerName}}, your bike {{BikeNumber}} is due for service. Visit Moto Gear SRK today!',
    reminderDaysBefore: 3,
    remindersPerDay: 1,
  },
  accounting: {
    enabled: false,
    allowJournalEntries: false,
  },
};

const runGAS = (funcName: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (isGAS) {
      (window as any).google.script.run
        .withSuccessHandler((data: any) => {
          if (Array.isArray(data)) {
            resolve(data.filter(item => item !== null));
          } else {
            resolve(data);
          }
        })
        .withFailureHandler(reject)[funcName](...args);
    } else {
      resolve(null);
    }
  });
};

export const dbService = {
  getConnectionStatus: () => isGAS ? 'connected' : 'preview',

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

  sendWhatsApp: (phone: string, message: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${formattedPhone.length === 10 ? '91' + formattedPhone : formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  getWADeviceStatus: () => {
    const status = localStorage.getItem(LS_KEYS.WA_DEVICE_STATUS);
    return status ? JSON.parse(status) : { connected: false, lastSeen: null, deviceName: 'Unknown' };
  },
  setWADeviceStatus: (status: any) => {
    localStorage.setItem(LS_KEYS.WA_DEVICE_STATUS, JSON.stringify(status));
  },

  parseLocationFromLink: (text: string) => {
    const longRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const queryRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const shortRegex = /maps\.app\.goo\.gl\/([a-zA-Z0-9]+)/;
    
    const longMatch = text.match(longRegex);
    if (longMatch) return { lat: parseFloat(longMatch[1]), lng: parseFloat(longMatch[2]) };
    
    const queryMatch = text.match(queryRegex);
    if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
    
    return null;
  },

  updateCustomerLocation: async (customerId: string, location: { lat: number; lng: number; address: string }): Promise<void> => {
    const customers = await dbService.getCustomers();
    const updated = customers.map(c => c.id === customerId ? { ...c, location } : c);
    localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify(updated));
  },

  getSlotsByDate: async (date: string): Promise<PickupSlot[]> => {
    const local = localStorage.getItem(LS_KEYS.PICKUP_SLOTS);
    const all: PickupSlot[] = local ? JSON.parse(local) : [];
    return all.filter(s => s.date === date);
  },

  initSlotsForDate: async (date: string, capacity: number): Promise<PickupSlot[]> => {
    const local = localStorage.getItem(LS_KEYS.PICKUP_SLOTS);
    let all: PickupSlot[] = local ? JSON.parse(local) : [];
    all = all.filter(s => s.date !== date);
    const timeRanges = ["9-11", "11-1", "2-4", "4-6"];
    const newSlots = timeRanges.map(range => ({
      id: `SLOT-${date}-${range}`,
      date,
      timeRange: range,
      capacity,
      bookedCount: 0
    }));
    all.push(...newSlots);
    localStorage.setItem(LS_KEYS.PICKUP_SLOTS, JSON.stringify(all));
    return newSlots;
  },

  updateSlotBookingCount: async (slotId: string, delta: number): Promise<void> => {
    const local = localStorage.getItem(LS_KEYS.PICKUP_SLOTS);
    if (!local) return;
    const all: PickupSlot[] = JSON.parse(local);
    const updated = all.map(s => s.id === slotId ? { ...s, bookedCount: Math.max(0, s.bookedCount + delta) } : s);
    localStorage.setItem(LS_KEYS.PICKUP_SLOTS, JSON.stringify(updated));
  },

  getPickupBookings: async (): Promise<PickupBooking[]> => {
    const local = localStorage.getItem(LS_KEYS.PICKUP_BOOKINGS);
    return local ? JSON.parse(local) : [];
  },

  addPickupBooking: async (data: Partial<PickupBooking>): Promise<PickupBooking> => {
    const current = await dbService.getPickupBookings();
    const newBooking: PickupBooking = {
      id: 'PCK-' + Date.now(),
      customerId: data.customerId || '',
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      bikeNumber: data.bikeNumber || '',
      slotId: data.slotId || '',
      date: data.date || new Date().toISOString().split('T')[0],
      timeRange: data.timeRange || '',
      status: PickupStatus.SCHEDULED,
      location: data.location || { lat: 0, lng: 0, address: '' },
      createdAt: new Date().toISOString()
    };

    if (newBooking.slotId) {
      await dbService.updateSlotBookingCount(newBooking.slotId, 1);
    }

    localStorage.setItem(LS_KEYS.PICKUP_BOOKINGS, JSON.stringify([...current, newBooking]));
    const msg = `Hi ${newBooking.customerName}, your pickup for ${newBooking.bikeNumber} is scheduled for ${newBooking.date} during the ${newBooking.timeRange} slot. We will notify you when our staff is on the way!`;
    dbService.sendWhatsApp(newBooking.customerPhone, msg);
    return newBooking;
  },

  updatePickupStatus: async (id: string, status: PickupStatus, staffId?: string, staffName?: string): Promise<void> => {
    const bookings = await dbService.getPickupBookings();
    const updated = bookings.map(b => {
      if (b.id === id) {
        const up = { ...b, status, staffId: staffId || b.staffId, staffName: staffName || b.staffName };
        if (status === PickupStatus.SCHEDULED && staffId && staffName) {
           const mapsLink = `https://www.google.com/maps?q=${b.location.lat},${b.location.lng}`;
           const msg = `New Pickup Assigned!\nCustomer: ${b.customerName}\nBike: ${b.bikeNumber}\nAddress: ${b.location.address}\nLocation: ${mapsLink}`;
           dbService.sendWhatsApp('9123456789', msg);
        }
        return up;
      }
      return b;
    });
    localStorage.setItem(LS_KEYS.PICKUP_BOOKINGS, JSON.stringify(updated));
  },

  getLiveStaffTracking: async (bookingId: string): Promise<StaffLocation | null> => {
    const all = JSON.parse(localStorage.getItem(LS_KEYS.LIVE_TRACKING) || '{}');
    return all[bookingId] || null;
  },

  getAllStaffLocations: async (): Promise<StaffLocation[]> => {
    const all = JSON.parse(localStorage.getItem(LS_KEYS.LIVE_TRACKING) || '{}');
    return Object.values(all);
  },

  updateStaffLocation: async (data: StaffLocation): Promise<void> => {
    const all = JSON.parse(localStorage.getItem(LS_KEYS.LIVE_TRACKING) || '{}');
    const key = data.bookingId === 'IDLE' ? `IDLE_${data.staffId}` : data.bookingId;
    all[key] = { ...data, lastUpdated: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.LIVE_TRACKING, JSON.stringify(all));
  },

  getAdSuggestions: async (businessName: string): Promise<AdSuggestion[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 professional social media ad suggestions for a bike service center named "${businessName}".`,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              headline: { type: Type.STRING },
              copy: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              estimatedPerformance: { type: Type.STRING }
            },
            required: ["platform", "headline", "copy", "targetAudience", "estimatedPerformance"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  },

  getBusinessHoroscope: async (businessName: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Give a short, motivational, mechanic-themed business insight for a bike center named "${businessName}". Max 40 words.`,
    });
    return response.text || "Perfect day for growth!";
  },

  generateMarketingContent: async (topic: string): Promise<{ caption: string, tags: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write an engaging Instagram caption and hashtags for this bike service promotion: "${topic}".`,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            tags: { type: Type.STRING }
          },
          required: ["caption", "tags"]
        }
      }
    });
    return JSON.parse(response.text || '{"caption":"","tags":""}');
  },

  searchLocalMarket: async (query: string, lat: number, lng: number): Promise<{ text: string, grounding: any[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-12-2024", // Using 2.5 series as required for Maps Grounding
      contents: `Explore "${query}" in the local market area around Pune. Focus on businesses that can supply or support a bike service center.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });
    return { 
      text: response.text || "No details found.", 
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    };
  },

  getCustomers: async (): Promise<Customer[]> => {
    const local = localStorage.getItem(LS_KEYS.CUSTOMERS);
    return local ? JSON.parse(local) : [];
  },
  addCustomer: async (data: any): Promise<Customer> => {
    const customers = await dbService.getCustomers();
    const newCust = { ...data, id: 'CUST-' + Date.now(), loyaltyPoints: 0, createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify([...customers, newCust]));
    return newCust;
  },
  deleteCustomer: async (id: string): Promise<void> => {
    const customers = await dbService.getCustomers();
    localStorage.setItem(LS_KEYS.CUSTOMERS, JSON.stringify(customers.filter(c => c.id !== id)));
  },

  getSalesmen: async (): Promise<Salesman[]> => {
    const local = localStorage.getItem(LS_KEYS.SALESMEN);
    return local ? JSON.parse(local) : [];
  },
  addSalesman: async (data: any): Promise<Salesman> => {
    const salesmen = await dbService.getSalesmen();
    const newSalesman: Salesman = { ...data, id: 'SM-' + Date.now(), salesCount: 0, totalSalesValue: 0, joinDate: new Date().toISOString(), status: 'Available' };
    localStorage.setItem(LS_KEYS.SALESMEN, JSON.stringify([...salesmen, newSalesman]));
    return newSalesman;
  },
  deleteSalesman: async (id: string): Promise<void> => {
    const salesmen = await dbService.getSalesmen();
    localStorage.setItem(LS_KEYS.SALESMEN, JSON.stringify(salesmen.filter(s => s.id !== id)));
  },

  getComplaints: async (): Promise<Complaint[]> => {
    const local = localStorage.getItem(LS_KEYS.COMPLAINTS);
    return local ? JSON.parse(local) : [];
  },
  addComplaint: async (data: any): Promise<Complaint> => {
    const complaints = await dbService.getComplaints();
    const newComp = { ...data, id: 'CMP-' + Date.now(), status: ComplaintStatus.PENDING, createdAt: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify([...complaints, newComp]));
    return newComp;
  },
  updateComplaintStatus: async (id: string, status: ComplaintStatus): Promise<void> => {
    const complaints = await dbService.getComplaints();
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(complaints.map(c => c.id === id ? { ...c, status } : c)));
  },
  assignComplaintMechanic: async (id: string, mechanicId: string, mechanicName: string): Promise<void> => {
    const complaints = await dbService.getComplaints();
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(complaints.map(c => 
      c.id === id ? { ...c, mechanicId, mechanicName, status: ComplaintStatus.IN_PROGRESS } : c
    )));
  },
  deleteComplaint: async (id: string): Promise<void> => {
    const complaints = await dbService.getComplaints();
    localStorage.setItem(LS_KEYS.COMPLAINTS, JSON.stringify(complaints.filter(c => c.id !== id)));
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const local = localStorage.getItem(LS_KEYS.INVOICES);
    return local ? JSON.parse(local) : [];
  },
  generateInvoice: async (data: any): Promise<Invoice> => {
    const invoices = await dbService.getInvoices();
    const newInv = { ...data, id: 'INV-' + Date.now(), date: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify([...invoices, newInv]));
    return newInv;
  },
  deleteInvoice: async (id: string): Promise<void> => {
    const invoices = await dbService.getInvoices();
    localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify(invoices.filter(i => i.id !== id)));
  },

  getInventory: async (): Promise<InventoryItem[]> => {
    const local = localStorage.getItem(LS_KEYS.INVENTORY);
    return local ? JSON.parse(local) : [];
  },
  addInventoryItem: async (data: any): Promise<InventoryItem> => {
    const inventory = await dbService.getInventory();
    const newItem = { ...data, id: 'SKU-' + Date.now(), lastUpdated: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify([...inventory, newItem]));
    return newItem;
  },
  updateStock: async (id: string, delta: number, note: string = 'Manual Adjustment'): Promise<void> => {
    const inventory = await dbService.getInventory();
    const updatedInventory = inventory.map(i => i.id === id ? { ...i, stock: i.stock + delta, lastUpdated: new Date().toISOString() } : i);
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(updatedInventory));
  },
  getStockTransactions: async (itemId: string): Promise<StockTransaction[]> => {
    const allTxns = JSON.parse(localStorage.getItem(LS_KEYS.STOCK_TRANSACTIONS) || '[]');
    return allTxns.filter((t: StockTransaction) => t.itemId === itemId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  deleteInventoryItem: async (id: string): Promise<void> => {
    const inventory = await dbService.getInventory();
    localStorage.setItem(LS_KEYS.INVENTORY, JSON.stringify(inventory.filter(i => i.id !== id)));
  },

  getExpenses: async (): Promise<Expense[]> => {
    const local = localStorage.getItem(LS_KEYS.EXPENSES);
    return local ? JSON.parse(local) : [];
  },
  addExpense: async (data: any): Promise<Expense> => {
    const expenses = await dbService.getExpenses();
    const newExp = { ...data, id: 'EXP-' + Date.now(), date: new Date().toISOString() };
    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify([...expenses, newExp]));
    return newExp;
  },
  deleteExpense: async (id: string): Promise<void> => {
    const expenses = await dbService.getExpenses();
    localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(expenses.filter(e => e.id !== id)));
  },

  getReminders: async (): Promise<ServiceReminder[]> => {
    const local = localStorage.getItem(LS_KEYS.REMINDERS);
    return local ? JSON.parse(local) : [];
  },
  addReminder: async (data: any): Promise<ServiceReminder> => {
    const reminders = await dbService.getReminders();
    const newRem = { ...data, id: 'REM-' + Date.now(), status: 'Pending' };
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify([...reminders, newRem]));
    return newRem;
  },
  deleteReminder: async (id: string): Promise<void> => {
    const reminders = await dbService.getReminders();
    localStorage.setItem(LS_KEYS.REMINDERS, JSON.stringify(reminders.filter(r => r.id !== id)));
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const customers = await dbService.getCustomers();
    const complaints = await dbService.getComplaints();
    const invoices = await dbService.getInvoices();
    const expenses = await dbService.getExpenses();
    const received = invoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, i) => sum + i.finalAmount, 0);
    const pending = invoices.filter(i => i.paymentStatus === 'Unpaid').reduce((sum, i) => sum + i.finalAmount, 0);
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      totalCustomers: customers.length,
      totalComplaints: complaints.length,
      totalInvoices: invoices.length,
      totalReceived: received,
      totalPending: pending,
      totalExpenses: spent,
      netProfit: received - spent,
      cashInHand: received - spent,
      bankBalance: 0
    };
  }
};
