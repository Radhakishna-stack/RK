
/**
 * BIKE SERVICE PRO - BACKEND CONTROLLER
 * Paste this into Code.gs in your Google Apps Script Editor.
 */

// Added global declarations to resolve "Cannot find name" errors in TypeScript environment
declare var SpreadsheetApp: any;
declare var HtmlService: any;
declare var PropertiesService: any;

// 1. RUN THIS ONCE to setup your spreadsheet
function initProject() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    'Customers': ['Customer_ID', 'Customer_Name', 'Phone_Number', 'Bike_Number', 'City', 'Loyalty_Points', 'Created_At', 'GSTIN'],
    'Complaints': ['Complaint_ID', 'Bike_Number', 'Customer_Name', 'Phone_Number', 'Complaint_List', 'Complaint_Photos_URL', 'Estimated_Cost', 'Status', 'Created_Date'],
    'Invoices': ['Invoice_ID', 'Complaint_ID', 'Bike_Number', 'Customer_Name', 'Complaint_Details', 'Items_JSON', 'Estimated_Cost', 'Final_Amount', 'Payment_Status', 'Payment_Mode', 'Invoice_Date', 'Tax_Amount', 'Sub_Total'],
    'Transactions': ['Transaction_ID', 'Invoice_ID', 'Amount', 'Payment_Mode', 'Date'],
    'Inventory': ['Item_ID', 'Item_Name', 'Category', 'Quantity_In_Stock', 'Unit_Price', 'Purchase_Price', 'Item_Code', 'Last_Updated', 'GST_Rate', 'HSN_Code'],
    'Expenses': ['Expense_ID', 'Expense_Title', 'Amount', 'Date', 'Notes', 'Payment_Mode'],
    'Reminders': ['Reminder_ID', 'Bike_Number', 'Customer_Name', 'Phone_Number', 'Reminder_Date', 'Service_Type', 'Status']
  };

  for (let name in sheets) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight("bold").setBackground("#f3f3f3");
    } else {
      // Update headers if missing
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (existingHeaders.length < sheets[name].length) {
        // Append missing headers
        // Note: Simple append for now, migration of data columns is manual if order changes
        sheet.getRange(1, 1, 1, sheets[name].length).setValues([sheets[name]]);
      }
    }
  }
  return "Project initialized successfully!";
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('BikeService Pro')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Mapping from Sheet Headers to Frontend Type Keys
const MAPPINGS = {
  'Customer_ID': 'id', 'Customer_Name': 'name', 'Phone_Number': 'phone', 'Bike_Number': 'bikeNumber', 'City': 'city', 'Loyalty_Points': 'loyaltyPoints', 'Created_At': 'createdAt', 'GSTIN': 'gstin',
  'Complaint_ID': 'id', 'Complaint_List': 'details', 'Complaint_Photos_URL': 'photoUrls', 'Created_Date': 'createdAt',
  'Invoice_ID': 'id', 'Invoice_Date': 'date', 'Payment_Status': 'paymentStatus', 'Payment_Mode': 'paymentMode', 'Final_Amount': 'finalAmount', 'Estimated_Cost': 'estimatedCost', 'Items_JSON': 'items', 'Tax_Amount': 'taxAmount', 'Sub_Total': 'subTotal',
  'Item_ID': 'id', 'Item_Name': 'name', 'Quantity_In_Stock': 'stock', 'Unit_Price': 'unitPrice', 'Purchase_Price': 'purchasePrice', 'Item_Code': 'itemCode', 'Last_Updated': 'lastUpdated', 'GST_Rate': 'gstRate', 'HSN_Code': 'hsn',
  'Expense_ID': 'id', 'Expense_Title': 'title',
  'Reminder_ID': 'id', 'Reminder_Date': 'reminderDate', 'Service_Type': 'serviceType'
};

function getSheetData(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return []; // Only headers or empty
  
  const headers = values.shift();
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const key = MAPPINGS[h] || h.toLowerCase();
      let val = row[i];
      if (key === 'photoUrls' && typeof val === 'string') val = val ? val.split(',') : [];
      if (key === 'items' && typeof val === 'string') {
        try { val = JSON.parse(val || '[]'); } catch(e) { val = []; }
      }
      obj[key] = val;
    });
    return obj;
  }).filter(item => item && item.id);
}

function findRowById(sheet, id, colIndex = 0) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex].toString() === id.toString()) return i + 1;
  }
  return null;
}

function deleteRowById(sheetName, id, idColIndex = 0) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;
  const row = findRowById(sheet, id, idColIndex);
  if (row) {
    sheet.deleteRow(row);
    return true;
  }
  return false;
}

// --- APP SETTINGS ---
function getSettings() {
  const props = PropertiesService.getScriptProperties();
  const settings = props.getProperty('APP_SETTINGS');
  return settings ? JSON.parse(settings) : null;
}

function updateSettings(settings) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('APP_SETTINGS', JSON.stringify(settings));
}

// --- API ENDPOINTS ---

function getCustomers() { return getSheetData('Customers'); }
function deleteCustomer(id) { return deleteRowById('Customers', id); }

function createCustomer(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Customers');
  const id = 'CUST-' + Date.now();
  const now = new Date();
  // id, name, phone, bikeNumber, city, loyaltyPoints, createdAt, gstin
  sheet.appendRow([id, data.name, data.phone, data.bikeNumber, data.city, 0, now, data.gstin || '']);
  return { ...data, id, loyaltyPoints: 0, createdAt: now.toISOString() };
}

function getComplaints() { return getSheetData('Complaints'); }
function deleteComplaint(id) { return deleteRowById('Complaints', id); }

function createComplaint(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Complaints');
  const id = 'CMP-' + Date.now();
  const now = new Date();
  sheet.appendRow([id, data.bikeNumber, data.customerName, data.customerPhone, data.details, (data.photoUrls || []).join(','), data.estimatedCost, 'Pending', now]);
  return { ...data, id, status: 'Pending', createdAt: now.toISOString() };
}

function updateComplaintStatus(id, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Complaints');
  const row = findRowById(sheet, id);
  if (row) sheet.getRange(row, 8).setValue(status);
}

function getInvoices() { return getSheetData('Invoices'); }
function deleteInvoice(id) { return deleteRowById('Invoices', id); }

function generateInvoice(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invSheet = ss.getSheetByName('Invoices');
  const txnSheet = ss.getSheetByName('Transactions');
  const custSheet = ss.getSheetByName('Customers');
  
  const id = 'INV-' + Date.now();
  const now = new Date();
  
  const itemsJson = JSON.stringify(data.items || []);
  // id, complaintId, bike, customer, details, items, estCost, finalAmount, status, mode, date, taxAmount, subTotal
  invSheet.appendRow([id, data.complaintId, data.bikeNumber, data.customerName, data.details, itemsJson, data.estimatedCost, data.finalAmount, data.paymentStatus, data.paymentMode, now, data.taxAmount || 0, data.subTotal || 0]);
  
  if (data.paymentStatus === 'Paid') {
    txnSheet.appendRow(['TXN-' + Date.now(), id, data.finalAmount, data.paymentMode, now]);
    const custRow = findRowById(custSheet, data.bikeNumber, 3);
    if (custRow) {
      const currentPoints = custSheet.getRange(custRow, 6).getValue();
      const earned = Math.floor(data.finalAmount / 100);
      custSheet.getRange(custRow, 6).setValue(currentPoints + earned);
    }
  }
  return { ...data, id, date: now.toISOString() };
}

function getInventory() { return getSheetData('Inventory'); }
function deleteInventoryItem(id) { return deleteRowById('Inventory', id); }

function addInventoryItem(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
  const id = 'SKU-' + Date.now();
  const now = new Date();
  // id, name, category, stock, unitPrice, purchasePrice, itemCode, lastUpdated, gstRate, hsn
  sheet.appendRow([id, data.name, data.category, data.stock, data.unitPrice, data.purchasePrice, data.itemCode, now, data.gstRate || 0, data.hsn || '']);
  return { ...data, id, lastUpdated: now.toISOString() };
}

function updateStock(id, delta) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
  const row = findRowById(sheet, id);
  if (row) {
    const range = sheet.getRange(row, 4);
    range.setValue(Number(range.getValue()) + delta);
    sheet.getRange(row, 8).setValue(new Date());
  }
}

function getExpenses() { return getSheetData('Expenses'); }
function deleteExpense(id) { return deleteRowById('Expenses', id); }

function addExpense(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Expenses');
  const id = 'EXP-' + Date.now();
  const now = new Date();
  sheet.appendRow([id, data.title, data.amount, now, data.notes, data.paymentMode]);
  return { ...data, id, date: now.toISOString() };
}

function getReminders() { return getSheetData('Reminders'); }
function createReminder(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reminders');
  const id = 'REM-' + Date.now();
  sheet.appendRow([id, data.bikeNumber, data.customerName, data.phone, data.reminderDate, data.serviceType, 'Pending']);
  return { ...data, id, status: 'Pending' };
}
function deleteReminder(id) { return deleteRowById('Reminders', id); }

function getDashboardStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customers = Math.max(0, ss.getSheetByName('Customers').getLastRow() - 1);
  const complaints = Math.max(0, ss.getSheetByName('Complaints').getLastRow() - 1);
  const invoicesCount = Math.max(0, ss.getSheetByName('Invoices').getLastRow() - 1);
  
  const txns = ss.getSheetByName('Transactions').getDataRange().getValues();
  let received = 0;
  for(let i=1; i<txns.length; i++) received += Number(txns[i][2]);
  
  const exps = ss.getSheetByName('Expenses').getDataRange().getValues();
  let spent = 0;
  let cashExpenses = 0;
  for(let i=1; i<exps.length; i++) {
    const amt = Number(exps[i][2]);
    spent += amt;
    if (exps[i][5] === 'Cash') cashExpenses += amt;
  }
  
  const invs = ss.getSheetByName('Invoices').getDataRange().getValues();
  let pending = 0;
  let cashInvoices = 0;
  for(let i=1; i<invs.length; i++) {
    const finalAmt = Number(invs[i][7]);
    if(invs[i][8] === 'Unpaid') pending += finalAmt;
    if(invs[i][8] === 'Paid' && invs[i][9] === 'Cash') cashInvoices += finalAmt;
  }

  const cashInHand = Math.max(0, cashInvoices - cashExpenses);
  const bankBalance = Math.max(0, received - cashInHand);

  return {
    totalCustomers: customers,
    totalComplaints: complaints,
    totalInvoices: invoicesCount,
    totalReceived: received,
    totalPending: pending,
    totalExpenses: spent,
    netProfit: received - spent,
    cashInHand: cashInHand,
    bankBalance: bankBalance
  };
}