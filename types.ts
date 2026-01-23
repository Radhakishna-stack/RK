
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

export type VisitorType = 'Spare Part Enquiry' | 'Other';

export interface Visitor {
  id: string;
  name: string;
  bikeNumber: string;
  phone: string;
  remarks: string;
  type: VisitorType;
  photoUrls: string[];
  createdAt: string;
}

export interface StockWantingItem {
  id: string;
  partNumber: string;
  itemName: string;
  quantity: number;
  rate: number;
  createdAt: string;
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
  dueDate?: string;
  odometerReading?: number;
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
  paymentStatus: 'Paid' | 'Pending' | 'Unpaid';
  accountId: string; // References BankAccount.id
  paymentMode: string; // Account Name for display
  date: string;
  odometerReading?: number;
  docType?: 'Sale' | 'Estimate';
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'Cash' | 'Savings' | 'Current' | 'UPI/Wallet';
  openingBalance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  entityId: string; // Party ID or description
  accountId: string; // Reference to BankAccount.id
  type: 'IN' | 'OUT';
  amount: number;
  paymentMode: string; // For legacy/display
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
  accountId: string;
  paymentMode: string;
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
  lastNotified?: string;
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

export type RecycleBinCategory = 'Customer' | 'Invoice' | 'Complaint' | 'Inventory' | 'Expense' | 'Visitor';

export interface RecycleBinItem {
  binId: string;
  originalId: string;
  type: RecycleBinCategory;
  data: any;
  deletedAt: string;
}

export interface AppSettings {
  general: {
    businessAddress: string;
    businessPhone: string;
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
    recycleBinDays: number;
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
    overdueDaysLimit: number; // Threshold for marking unpaid bills as overdue
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
    loyaltyRate: number; // ₹ amount spent for 1 point
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
