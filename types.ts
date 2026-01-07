
export interface Customer {
  id: string;
  name: string;
  phone: string;
  bikeNumber: string;
  city: string;
  email?: string;
  address?: string;
  gstin?: string;
  loyaltyPoints: number;
  createdAt: string;
  location?: { lat: number; lng: number; address: string };
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

export enum PickupStatus {
  SCHEDULED = 'Scheduled',
  ON_THE_WAY = 'On the Way',
  PICKED_UP = 'Picked Up',
  AT_CENTER = 'At Center',
  DELIVERING = 'Delivering',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export interface PickupSlot {
  id: string;
  date: string;
  timeRange: string; // "9-11", "11-1", "2-4", "4-6"
  capacity: number;
  bookedCount: number;
}

export interface PickupBooking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  bikeNumber: string;
  slotId: string;
  date: string;
  timeRange: string;
  status: PickupStatus;
  staffId?: string;
  staffName?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: string;
}

export interface StaffLocation {
  staffId: string;
  bookingId: string | 'IDLE';
  lat: number;
  lng: number;
  lastUpdated: string;
  staffName: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  gstRate?: number;
  inventoryItemId?: string;
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
  entityId: string;
  type: 'IN' | 'OUT';
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Cheque';
  date: string;
  description: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  note: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unitPrice: number;
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

export interface Salesman {
  id: string;
  name: string;
  phone: string;
  target: number;
  salesCount: number;
  totalSalesValue: number;
  joinDate: string;
  status?: 'Available' | 'On Task' | 'Offline';
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
    showInvoiceNumber: boolean;
    cashSaleDefault: boolean;
    billingName: boolean;
    poDetails: boolean;
    addTime: boolean;
    inclusiveTax: boolean;
    showPurchasePrice: boolean;
    freeItemQuantity: boolean;
    countChangeLabel: string;
    countChange: boolean;
    barcodeScanning: boolean;
    txnWiseTax: boolean;
    txnWiseDiscount: boolean;
    roundOffTransaction: boolean;
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
    textSize: 'Small' | 'Medium' | 'Large';
    pageSize: string;
    orientation: 'Portrait' | 'Landscape';
    showUnsavedWarning: boolean;
    showCompanyName: boolean;
    companyNameSize: 'Small' | 'Medium' | 'Large';
    showLogo: boolean;
    showAddress: boolean;
    showEmail: boolean;
    showPhoneNumber: boolean;
    showGstin: boolean;
    printBillOfSupply: boolean;
    extraSpacesTop: number;
    printOriginalDuplicate: boolean;
    minRowsInTable: number;
    totalItemQuantity: boolean;
    amountWithDecimal: boolean;
    receivedAmount: boolean;
    balanceAmount: boolean;
    printCurrentBalance: boolean;
    taxDetails: boolean;
    amountGrouping: boolean;
    amountInWordsFormat: string;
    showYouSaved: boolean;
    printDescription: boolean;
    printReceivedBy: boolean;
    printDeliveredBy: boolean;
    printSignatureText: boolean;
    customSignatureText: string;
    printPaymentMode: boolean;
    printAcknowledgement: boolean;
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
    transactionMessaging: {
      sendToParty: boolean;
      smsCopyToSelf: boolean;
      txnUpdateSms: boolean;
      showPartyBalance: boolean;
      showWebInvoiceLink: boolean;
      autoShareVyapar: boolean;
      autoMsgTypes: {
        sale: boolean;
        purchase: boolean;
        saleReturn: boolean;
        purchaseReturn: boolean;
        estimate: boolean;
        proforma: boolean;
        paymentIn: boolean;
        paymentOut: boolean;
        saleOrder: boolean;
        purchaseOrder: boolean;
        deliveryChallan: boolean;
        cancelledInvoice: boolean;
      };
    };
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
    manualDateSelection: boolean;
    defaultInterval: string;
    reminderTemplate: string;
    reminderDaysBefore: number;
    remindersPerDay: number;
  };
  accounting: {
    enabled: boolean;
    allowJournalEntries: boolean;
  };
}
