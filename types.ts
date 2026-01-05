

export interface Customer {
  id: string;
  name: string;
  phone: string;
  bikeNumber: string;
  city: string;
  gstin?: string;
  loyaltyPoints: number;
  createdAt: string;
  location?: { lat: number; lng: number };
}

export enum ComplaintStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface Complaint {
  id: string;
  bikeNumber: string;
  customerName: string;
  customerPhone: string;
  details: string;
  photoUrls: string[];
  estimatedCost: number;
  status: ComplaintStatus;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  gstRate?: number;
}

export interface Invoice {
  id: string;
  complaintId: string;
  bikeNumber: string;
  customerName: string;
  details: string;
  items: InvoiceItem[];
  estimatedCost: number;
  finalAmount: number;
  taxAmount?: number;
  subTotal?: number;
  paymentStatus: 'Paid' | 'Unpaid';
  paymentMode: 'Cash' | 'UPI' | 'Card';
  date: string;
}

export interface Transaction {
  id: string;
  entityId: string; // Invoice or Expense ID
  type: 'IN' | 'OUT';
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Cheque';
  date: string;
  description: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unitPrice: number; // Sale Price
  purchasePrice: number;
  itemCode: string;
  gstRate?: number;
  hsn?: string;
  lastUpdated: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  notes: string;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Cheque';
}

export interface ServiceReminder {
  id: string;
  bikeNumber: string;
  customerName: string;
  phone: string;
  reminderDate: string;
  serviceType: string;
  status: 'Pending' | 'Sent';
}

export interface DashboardStats {
  totalCustomers: number;
  totalComplaints: number;
  totalInvoices: number;
  totalReceived: number;
  totalPending: number;
  totalExpenses: number;
  netProfit: number;
  cashInHand: number;
  bankBalance: number;
}

export interface AdSuggestion {
  platform: string;
  headline: string;
  copy: string;
  targetAudience: string;
  estimatedPerformance: string;
}

export interface AppSettings {
  general: {
    passcodeEnabled: boolean;
    passcode: string;
    currency: string;
    decimalPlaces: number;
    stopNegativeStock: boolean;
    blockNewItems: boolean;
    features: {
      estimates: boolean;
      proforma: boolean;
      orders: boolean;
      challan: boolean;
      fixedAssets: boolean;
    };
    multiFirm: boolean;
    auditTrail: boolean;
  };
  transaction: {
    // Header
    showInvoiceNumber: boolean;
    cashSaleDefault: boolean;
    billingName: boolean;
    poDetails: boolean;
    addTime: boolean;
    
    // Items
    inclusiveTax: boolean;
    showPurchasePrice: boolean;
    freeItemQuantity: boolean;
    countChangeLabel: string; // Used for "Count" label
    countChange: boolean;
    barcodeScanning: boolean;

    // Taxes & Totals
    txnWiseTax: boolean;
    txnWiseDiscount: boolean;
    roundOffTransaction: boolean;

    // More Features
    shareTransactionAs: string;
    passcodeEditDelete: boolean;
    discountDuringPayment: boolean;
    linkPaymentsToInvoices: boolean;
    dueDatesAndTerms: boolean;
    enableInvoicePreview: boolean;
    showProfit: boolean;
    additionalFields: boolean;
    transportationDetails: boolean;
    additionalCharges: boolean;

    prefixes: {
      firmName: string;
      sale: string;
      creditNote: string;
      saleOrder: string;
      purchaseOrder: string;
      estimate: string;
      paymentIn: string;
    };
  };
  print: {
    printerType: 'Regular' | 'Thermal';
    theme: string;
    showCompanyName: boolean;
    showLogo: boolean;
    showAddress: boolean;
    showEmail: boolean;
    paperSize: string;
  };
  gst: {
    enabled: boolean;
    showHsn: boolean;
    rcm: boolean;
    placeOfSupply: boolean;
    composite: boolean;
    reverseCharge: boolean;
    stateOfSupply: boolean;
    ewayBill: boolean;
  };
  messages: {
    channel: 'SMS' | 'WhatsApp';
    sendToParty: boolean;
    copyToSelf: boolean;
    template: string;
  };
  party: {
    gstin: boolean;
    grouping: boolean;
    shippingAddress: boolean;
    loyaltyPoints: boolean;
    paymentReminders: boolean;
    reminderOffset: number;
    additionalFields: Array<{ label: string; showOnPrint: boolean }>;
  };
  item: {
    isProduct: boolean;
    stockMaintenance: boolean;
    serialTracking: boolean;
    batchTracking: boolean;
    mrpColumn: boolean;
  };
  reminders: {
    enabled: boolean;
    autoSchedule: boolean;
    defaultInterval: string;
    reminderTemplate: string;
  };
  accounting: {
    enabled: boolean;
    allowJournalEntries: boolean;
  };
}