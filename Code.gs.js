/**
 * MOTO GEAR SRK - GOOGLE APPS SCRIPT BACKEND
 * ============================================
 * Paste this ENTIRE file into Code.gs in your Google Apps Script Editor.
 * Then: Deploy → New Deployment → Web App → Execute as: Me → Who has access: Anyone
 * Copy the Web App URL and paste it into the Cloud Sync settings page.
 */

// ============================================
// 1. INITIALIZATION - RUN THIS ONCE
// ============================================

function initProject() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = {
        'Customers': ['ID', 'Name', 'Phone', 'BikeNumber', 'City', 'Email', 'Address', 'GSTIN', 'LoyaltyPoints', 'CreatedAt'],
        'Invoices': ['ID', 'ComplaintID', 'BikeNumber', 'CustomerName', 'CustomerPhone', 'Details', 'Items_JSON', 'EstimatedCost', 'FinalAmount', 'TaxAmount', 'SubTotal', 'PaymentStatus', 'AccountID', 'PaymentMode', 'Date', 'OdometerReading', 'DocType', 'ServiceReminderDate', 'PayCollCash', 'PayCollUPI', 'PayCollUPIAcctID'],
        'Inventory': ['ID', 'Name', 'Category', 'Stock', 'UnitPrice', 'PurchasePrice', 'ItemCode', 'GSTRate', 'HSN', 'LastUpdated'],
        'Transactions': ['ID', 'EntityID', 'AccountID', 'Type', 'Amount', 'PaymentMode', 'Date', 'Description', 'Category', 'Status', 'ChequeNumber', 'PartyName', 'BankName', 'Items_JSON'],
        'Expenses': ['ID', 'Description', 'Amount', 'Category', 'Date', 'PaymentMode', 'TransactionID', 'AccountID'],
        'BankAccounts': ['ID', 'Name', 'BankName', 'AccountNumber', 'Type', 'OpeningBalance', 'CreatedAt'],
        'PaymentReceipts': ['ID', 'ReceiptNumber', 'CustomerID', 'CustomerName', 'CustomerPhone', 'BikeNumber', 'CashAmount', 'UPIAmount', 'TotalAmount', 'Date', 'Description', 'CreatedAt'],
        'Complaints': ['ID', 'BikeNumber', 'CustomerName', 'CustomerPhone', 'Details', 'PhotoUrls', 'EstimatedCost', 'Status', 'CreatedAt', 'DueDate', 'OdometerReading'],
        'StockWanting': ['ID', 'PartNumber', 'ItemName', 'Quantity', 'Rate', 'CreatedAt'],
        'Visitors': ['ID', 'Name', 'BikeNumber', 'Phone', 'Remarks', 'Type', 'PhotoUrls', 'CreatedAt'],
        'ServiceReminders': ['ID', 'BikeNumber', 'CustomerName', 'Phone', 'ReminderDate', 'ServiceType', 'Status', 'LastNotified', 'Message', 'ServiceDate'],
        'StockTransactions': ['ID', 'ItemID', 'Type', 'Quantity', 'Date', 'Note'],
        'Salesmen': ['ID', 'Name', 'Phone', 'Target', 'SalesCount', 'TotalSalesValue', 'JoinDate', 'Status'],
        'Users': ['ID', 'Username', 'Password', 'Role', 'Name', 'Phone', 'CreatedAt', 'IsActive'],
        'Config': ['Key', 'Value', 'UpdatedAt'],
        'RecycleBin': ['BinID', 'OriginalID', 'Type', 'Data_JSON', 'DeletedAt']
    };

    for (var name in sheets) {
        var sheet = ss.getSheetByName(name);
        if (!sheet) {
            sheet = ss.insertSheet(name);
        }
        var headers = sheets[name];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8EAF6');
        sheet.setFrozenRows(1);
    }

    // Add default Cash account if BankAccounts is empty
    var bankSheet = ss.getSheetByName('BankAccounts');
    if (bankSheet.getLastRow() <= 1) {
        bankSheet.appendRow(['CASH-01', 'CASH IN HAND', '', '', 'Cash', 0, new Date().toISOString()]);
    }

    return 'Project initialized with ' + Object.keys(sheets).length + ' sheets!';
}

// ============================================
// 2. HTTP ENTRY POINTS
// ============================================

function doGet(e) {
    var output = { status: 'ok', message: 'Moto Gear SRK API is running', timestamp: new Date().toISOString() };
    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    var lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);

        var payload = JSON.parse(e.postData.contents);
        var action = payload.action;
        var data = payload.data;

        if (!ACTIONS[action]) {
            return jsonResponse({ error: 'Unknown action: ' + action });
        }

        var result = ACTIONS[action](data);
        return jsonResponse({ success: true, data: result });

    } catch (error) {
        return jsonResponse({ error: error.message || 'Unknown error' });
    } finally {
        lock.releaseLock();
    }
}

function jsonResponse(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// 3. UTILITY FUNCTIONS
// ============================================

function getSheet(name) {
    return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function genId(prefix) {
    return prefix + Date.now() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

function nowISO() {
    return new Date().toISOString();
}

function getSheetData(sheetName, fieldMap) {
    var sheet = getSheet(sheetName);
    if (!sheet) return [];

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];

    var rows = values.slice(1);

    return rows.map(function (row) {
        var obj = {};
        fieldMap.forEach(function (key, i) {
            if (i < row.length) {
                var val = row[i];
                // Auto-convert JSON fields
                if (key.endsWith('_JSON') || key === 'items') {
                    try { val = JSON.parse(val || '[]'); } catch (e) { val = key === 'items' ? [] : val; }
                }
                // Auto-convert arrays stored as comma-separated
                if (key === 'photoUrls' && typeof val === 'string') {
                    val = val ? val.split(',').map(function (s) { return s.trim(); }) : [];
                }
                // Auto-convert booleans
                if (val === 'TRUE' || val === true) val = true;
                if (val === 'FALSE' || val === false) val = false;

                obj[key] = val;
            }
        });
        return obj;
    }).filter(function (item) { return item && item.id; });
}

function findRowIndex(sheetName, id, colIndex) {
    colIndex = colIndex || 0;
    var sheet = getSheet(sheetName);
    if (!sheet) return null;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][colIndex] && data[i][colIndex].toString() === id.toString()) {
            return i + 1;
        }
    }
    return null;
}

function deleteRow(sheetName, id, colIndex) {
    colIndex = colIndex || 0;
    var row = findRowIndex(sheetName, id, colIndex);
    if (row) {
        getSheet(sheetName).deleteRow(row);
        return true;
    }
    return false;
}

function updateRow(sheetName, id, values, colIndex) {
    colIndex = colIndex || 0;
    var row = findRowIndex(sheetName, id, colIndex);
    if (row) {
        var sheet = getSheet(sheetName);
        sheet.getRange(row, 1, 1, values.length).setValues([values]);
        return true;
    }
    return false;
}

function updateCell(sheetName, id, colNum, value, idColIndex) {
    idColIndex = idColIndex || 0;
    var row = findRowIndex(sheetName, id, idColIndex);
    if (row) {
        getSheet(sheetName).getRange(row, colNum).setValue(value);
        return true;
    }
    return false;
}

// ============================================
// 4. ENTITY CRUD OPERATIONS
// ============================================

// --- CUSTOMERS ---
var CUSTOMER_FIELDS = ['id', 'name', 'phone', 'bikeNumber', 'city', 'email', 'address', 'gstin', 'loyaltyPoints', 'createdAt'];

function getCustomers() { return getSheetData('Customers', CUSTOMER_FIELDS); }

function addCustomer(data) {
    var id = genId('CUST-');
    var row = [id, data.name || '', data.phone || '', data.bikeNumber || '', data.city || '', data.email || '', data.address || '', data.gstin || '', data.loyaltyPoints || 0, nowISO()];
    getSheet('Customers').appendRow(row);
    return { id: id, name: data.name, phone: data.phone, bikeNumber: data.bikeNumber, loyaltyPoints: data.loyaltyPoints || 0, createdAt: nowISO() };
}

function updateCustomer(data) {
    var row = [data.id, data.name || '', data.phone || '', data.bikeNumber || '', data.city || '', data.email || '', data.address || '', data.gstin || '', data.loyaltyPoints || 0, data.createdAt || nowISO()];
    return updateRow('Customers', data.id, row);
}

function deleteCustomer(data) { return deleteRow('Customers', data.id); }

function updateCustomerLoyalty(data) {
    return updateCell('Customers', data.id, 9, data.loyaltyPoints);
}

// --- INVOICES ---
var INVOICE_FIELDS = ['id', 'complaintId', 'bikeNumber', 'customerName', 'customerPhone', 'details', 'items', 'estimatedCost', 'finalAmount', 'taxAmount', 'subTotal', 'paymentStatus', 'accountId', 'paymentMode', 'date', 'odometerReading', 'docType', 'serviceReminderDate', 'payCollCash', 'payCollUPI', 'payCollUPIAcctID'];

function getInvoices() {
    var raw = getSheetData('Invoices', INVOICE_FIELDS);
    return raw.map(function (inv) {
        inv.paymentCollections = {
            cash: Number(inv.payCollCash) || 0,
            upi: Number(inv.payCollUPI) || 0,
            upiAccountId: inv.payCollUPIAcctID || ''
        };
        return inv;
    });
}

function addInvoice(data) {
    var id = (data.docType === 'Estimate' ? 'EST-' : 'INV-') + genId('');
    var itemsJson = JSON.stringify(data.items || []);
    var pc = data.paymentCollections || {};
    var row = [id, data.complaintId || '', data.bikeNumber || '', data.customerName || '', data.customerPhone || '', data.details || '', itemsJson, data.estimatedCost || 0, data.finalAmount || 0, data.taxAmount || 0, data.subTotal || 0, data.paymentStatus || 'Pending', data.accountId || '', data.paymentMode || '', nowISO(), data.odometerReading || '', data.docType || 'Sale', data.serviceReminderDate || '', pc.cash || 0, pc.upi || 0, pc.upiAccountId || ''];
    getSheet('Invoices').appendRow(row);
    return { id: id, date: nowISO() };
}

function updateInvoice(data) {
    var itemsJson = JSON.stringify(data.items || []);
    var pc = data.paymentCollections || {};
    var row = [data.id, data.complaintId || '', data.bikeNumber || '', data.customerName || '', data.customerPhone || '', data.details || '', itemsJson, data.estimatedCost || 0, data.finalAmount || 0, data.taxAmount || 0, data.subTotal || 0, data.paymentStatus || 'Pending', data.accountId || '', data.paymentMode || '', data.date || nowISO(), data.odometerReading || '', data.docType || 'Sale', data.serviceReminderDate || '', pc.cash || 0, pc.upi || 0, pc.upiAccountId || ''];
    return updateRow('Invoices', data.id, row);
}

function deleteInvoice(data) { return deleteRow('Invoices', data.id); }

// --- INVENTORY ---
var INVENTORY_FIELDS = ['id', 'name', 'category', 'stock', 'unitPrice', 'purchasePrice', 'itemCode', 'gstRate', 'hsn', 'lastUpdated'];

function getInventory() { return getSheetData('Inventory', INVENTORY_FIELDS); }

function addInventoryItem(data) {
    var id = genId('SKU-');
    var row = [id, data.name || '', data.category || '', data.stock || 0, data.unitPrice || 0, data.purchasePrice || 0, data.itemCode || '', data.gstRate || 0, data.hsn || '', nowISO()];
    getSheet('Inventory').appendRow(row);
    return { id: id, lastUpdated: nowISO() };
}

function updateInventoryItem(data) {
    var row = [data.id, data.name || '', data.category || '', data.stock || 0, data.unitPrice || 0, data.purchasePrice || 0, data.itemCode || '', data.gstRate || 0, data.hsn || '', nowISO()];
    return updateRow('Inventory', data.id, row);
}

function deleteInventoryItem(data) { return deleteRow('Inventory', data.id); }

function updateStock(data) {
    var row = findRowIndex('Inventory', data.id);
    if (row) {
        var sheet = getSheet('Inventory');
        var currentStock = Number(sheet.getRange(row, 4).getValue()) || 0;
        sheet.getRange(row, 4).setValue(currentStock + (data.delta || 0));
        sheet.getRange(row, 10).setValue(nowISO());
        return true;
    }
    return false;
}

function bulkUpdateInventory(data) {
    var sheet = getSheet('Inventory');
    var allData = sheet.getDataRange().getValues();
    var updated = 0, created = 0;

    var items = data.items || [];
    for (var idx = 0; idx < items.length; idx++) {
        var item = items[idx];
        var found = false;
        for (var i = 1; i < allData.length; i++) {
            if ((allData[i][1] && allData[i][1].toString().toLowerCase() === (item.name || '').toString().toLowerCase()) ||
                (allData[i][6] && allData[i][6].toString().toLowerCase() === (item.itemCode || '').toString().toLowerCase())) {
                var rowNum = i + 1;
                if (item.stock !== undefined) sheet.getRange(rowNum, 4).setValue(item.stock);
                if (item.unitPrice !== undefined) sheet.getRange(rowNum, 5).setValue(item.unitPrice);
                if (item.purchasePrice !== undefined) sheet.getRange(rowNum, 6).setValue(item.purchasePrice);
                sheet.getRange(rowNum, 10).setValue(nowISO());
                updated++;
                found = true;
                break;
            }
        }
        if (!found) {
            var newId = genId('SKU-');
            sheet.appendRow([newId, item.name || '', item.category || '', item.stock || 0, item.unitPrice || 0, item.purchasePrice || 0, item.itemCode || '', item.gstRate || 0, item.hsn || '', nowISO()]);
            created++;
        }
    }
    return { updated: updated, created: created };
}

// --- TRANSACTIONS ---
var TXN_FIELDS = ['id', 'entityId', 'accountId', 'type', 'amount', 'paymentMode', 'date', 'description', 'category', 'status', 'chequeNumber', 'partyName', 'bankName', 'items'];

function getTransactions() { return getSheetData('Transactions', TXN_FIELDS); }

function addTransaction(data) {
    var id = genId('TXN-');
    var itemsJson = JSON.stringify(data.items || []);
    var row = [id, data.entityId || '', data.accountId || '', data.type || '', data.amount || 0, data.paymentMode || '', data.date || nowISO(), data.description || '', data.category || '', data.status || 'completed', data.chequeNumber || '', data.partyName || '', data.bankName || '', itemsJson];
    getSheet('Transactions').appendRow(row);
    return { id: id };
}

function updateTransaction(data) {
    var itemsJson = JSON.stringify(data.items || []);
    var row = [data.id, data.entityId || '', data.accountId || '', data.type || '', data.amount || 0, data.paymentMode || '', data.date || nowISO(), data.description || '', data.category || '', data.status || 'completed', data.chequeNumber || '', data.partyName || '', data.bankName || '', itemsJson];
    return updateRow('Transactions', data.id, row);
}

function deleteTransaction(data) { return deleteRow('Transactions', data.id); }

// --- EXPENSES ---
var EXPENSE_FIELDS = ['id', 'description', 'amount', 'category', 'date', 'paymentMode', 'transactionId', 'accountId'];

function getExpenses() { return getSheetData('Expenses', EXPENSE_FIELDS); }

function addExpense(data) {
    var id = genId('EXP-');
    var row = [id, data.description || data.title || '', data.amount || 0, data.category || '', data.date || nowISO(), data.paymentMode || '', data.transactionId || '', data.accountId || ''];
    getSheet('Expenses').appendRow(row);
    return { id: id, date: data.date || nowISO() };
}

function updateExpense(data) {
    var row = [data.id, data.description || data.title || '', data.amount || 0, data.category || '', data.date || '', data.paymentMode || '', data.transactionId || '', data.accountId || ''];
    return updateRow('Expenses', data.id, row);
}

function deleteExpense(data) { return deleteRow('Expenses', data.id); }

// --- BANK ACCOUNTS ---
var BANK_FIELDS = ['id', 'name', 'bankName', 'accountNumber', 'type', 'openingBalance', 'createdAt'];

function getBankAccounts() { return getSheetData('BankAccounts', BANK_FIELDS); }

function addBankAccount(data) {
    var id = genId('BANK-');
    var row = [id, data.name || '', data.bankName || '', data.accountNumber || '', data.type || 'Savings', data.openingBalance || 0, nowISO()];
    getSheet('BankAccounts').appendRow(row);
    return { id: id, createdAt: nowISO() };
}

function deleteBankAccount(data) { return deleteRow('BankAccounts', data.id); }

// --- PAYMENT RECEIPTS ---
var PR_FIELDS = ['id', 'receiptNumber', 'customerId', 'customerName', 'customerPhone', 'bikeNumber', 'cashAmount', 'upiAmount', 'totalAmount', 'date', 'description', 'createdAt'];

function getPaymentReceipts() { return getSheetData('PaymentReceipts', PR_FIELDS); }

function addPaymentReceipt(data) {
    var id = genId('PR-');
    var sheet = getSheet('PaymentReceipts');
    var count = Math.max(0, sheet.getLastRow() - 1) + 1;
    var receiptNumber = 'PR-' + count.toString().padStart(4, '0');
    var row = [id, receiptNumber, data.customerId || '', data.customerName || '', data.customerPhone || '', data.bikeNumber || '', data.cashAmount || 0, data.upiAmount || 0, data.totalAmount || 0, data.date || nowISO(), data.description || '', nowISO()];
    sheet.appendRow(row);
    return { id: id, receiptNumber: receiptNumber, createdAt: nowISO() };
}

function updatePaymentReceipt(data) {
    var row = [data.id, data.receiptNumber || '', data.customerId || '', data.customerName || '', data.customerPhone || '', data.bikeNumber || '', data.cashAmount || 0, data.upiAmount || 0, data.totalAmount || 0, data.date || '', data.description || '', data.createdAt || ''];
    return updateRow('PaymentReceipts', data.id, row);
}

function deletePaymentReceipt(data) { return deleteRow('PaymentReceipts', data.id); }

// --- COMPLAINTS (JOB CARDS) ---
var COMPLAINT_FIELDS = ['id', 'bikeNumber', 'customerName', 'customerPhone', 'details', 'photoUrls', 'estimatedCost', 'status', 'createdAt', 'dueDate', 'odometerReading'];

function getComplaints() { return getSheetData('Complaints', COMPLAINT_FIELDS); }

function addComplaint(data) {
    var id = genId('CMP-');
    var photos = Array.isArray(data.photoUrls) ? data.photoUrls.join(',') : (data.photoUrls || '');
    var row = [id, data.bikeNumber || '', data.customerName || '', data.customerPhone || '', data.details || '', photos, data.estimatedCost || 0, data.status || 'Pending', nowISO(), data.dueDate || '', data.odometerReading || ''];
    getSheet('Complaints').appendRow(row);
    return { id: id, status: data.status || 'Pending', createdAt: nowISO() };
}

function updateComplaint(data) {
    var photos = Array.isArray(data.photoUrls) ? data.photoUrls.join(',') : (data.photoUrls || '');
    var row = [data.id, data.bikeNumber || '', data.customerName || '', data.customerPhone || '', data.details || '', photos, data.estimatedCost || 0, data.status || 'Pending', data.createdAt || '', data.dueDate || '', data.odometerReading || ''];
    return updateRow('Complaints', data.id, row);
}

function updateComplaintStatus(data) {
    return updateCell('Complaints', data.id, 8, data.status);
}

function deleteComplaint(data) { return deleteRow('Complaints', data.id); }

// --- STOCK WANTING ---
var SW_FIELDS = ['id', 'partNumber', 'itemName', 'quantity', 'rate', 'createdAt'];

function getStockWanting() { return getSheetData('StockWanting', SW_FIELDS); }

function addStockWanting(data) {
    var id = genId('SW-');
    var row = [id, data.partNumber || '', data.itemName || '', data.quantity || 0, data.rate || 0, nowISO()];
    getSheet('StockWanting').appendRow(row);
    return { id: id, createdAt: nowISO() };
}

function deleteStockWanting(data) { return deleteRow('StockWanting', data.id); }

// --- VISITORS ---
var VISITOR_FIELDS = ['id', 'name', 'bikeNumber', 'phone', 'remarks', 'type', 'photoUrls', 'createdAt'];

function getVisitors() { return getSheetData('Visitors', VISITOR_FIELDS); }

function addVisitor(data) {
    var id = genId('VIS-');
    var photos = Array.isArray(data.photoUrls) ? data.photoUrls.join(',') : (data.photoUrls || '');
    var row = [id, data.name || '', data.bikeNumber || '', data.phone || '', data.remarks || '', data.type || 'Other', photos, nowISO()];
    getSheet('Visitors').appendRow(row);
    return { id: id, createdAt: nowISO() };
}

function deleteVisitor(data) { return deleteRow('Visitors', data.id); }

// --- SERVICE REMINDERS ---
var REMINDER_FIELDS = ['id', 'bikeNumber', 'customerName', 'phone', 'reminderDate', 'serviceType', 'status', 'lastNotified', 'message', 'serviceDate'];

function getReminders() { return getSheetData('ServiceReminders', REMINDER_FIELDS); }

function addReminder(data) {
    var id = genId('REM-');
    var row = [id, data.bikeNumber || '', data.customerName || '', data.phone || '', data.reminderDate || '', data.serviceType || '', data.status || 'Pending', '', data.message || '', data.serviceDate || ''];
    getSheet('ServiceReminders').appendRow(row);
    return { id: id, status: data.status || 'Pending' };
}

function updateReminder(data) {
    var row = [data.id, data.bikeNumber || '', data.customerName || '', data.phone || '', data.reminderDate || '', data.serviceType || '', data.status || 'Pending', data.lastNotified || '', data.message || '', data.serviceDate || ''];
    return updateRow('ServiceReminders', data.id, row);
}

function updateReminderStatus(data) {
    return updateCell('ServiceReminders', data.id, 7, data.status);
}

function deleteReminder(data) { return deleteRow('ServiceReminders', data.id); }

// --- STOCK TRANSACTIONS ---
var ST_FIELDS = ['id', 'itemId', 'type', 'quantity', 'date', 'note'];

function getStockTransactions() { return getSheetData('StockTransactions', ST_FIELDS); }

function addStockTransaction(data) {
    var id = genId('ST-');
    var row = [id, data.itemId || '', data.type || 'IN', data.quantity || 0, data.date || nowISO(), data.note || ''];
    getSheet('StockTransactions').appendRow(row);
    return { id: id };
}

// --- SALESMEN ---
var SALESMAN_FIELDS = ['id', 'name', 'phone', 'target', 'salesCount', 'totalSalesValue', 'joinDate', 'status'];

function getSalesmen() { return getSheetData('Salesmen', SALESMAN_FIELDS); }

function addSalesman(data) {
    var id = genId('SM-');
    var row = [id, data.name || '', data.phone || '', data.target || 0, 0, 0, data.joinDate || nowISO(), data.status || 'Available'];
    getSheet('Salesmen').appendRow(row);
    return { id: id, salesCount: 0, totalSalesValue: 0 };
}

function deleteSalesman(data) { return deleteRow('Salesmen', data.id); }

// --- USERS ---
var USER_FIELDS = ['id', 'username', 'password', 'role', 'name', 'phone', 'createdAt', 'isActive'];

function getUsers() { return getSheetData('Users', USER_FIELDS); }

function addUser(data) {
    var id = genId('USR-');
    var row = [id, data.username || '', data.password || '', data.role || 'employee', data.name || '', data.phone || '', nowISO(), true];
    getSheet('Users').appendRow(row);
    return { id: id, createdAt: nowISO(), isActive: true };
}

function updateUser(data) {
    var row = [data.id, data.username || '', data.password || '', data.role || 'employee', data.name || '', data.phone || '', data.createdAt || '', data.isActive !== false];
    return updateRow('Users', data.id, row);
}

function deleteUser(data) { return deleteRow('Users', data.id); }

function toggleUserStatus(data) {
    var row = findRowIndex('Users', data.id);
    if (row) {
        var sheet = getSheet('Users');
        var current = sheet.getRange(row, 8).getValue();
        sheet.getRange(row, 8).setValue(!current);
        return true;
    }
    return false;
}

// --- CONFIG (Settings + Permissions) ---
function getConfig(data) {
    var sheet = getSheet('Config');
    var allData = sheet.getDataRange().getValues();
    for (var i = 1; i < allData.length; i++) {
        if (allData[i][0] === data.key) {
            try { return JSON.parse(allData[i][1]); } catch (e) { return allData[i][1]; }
        }
    }
    return null;
}

function setConfig(data) {
    var sheet = getSheet('Config');
    var allData = sheet.getDataRange().getValues();
    var valueStr = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);

    for (var i = 1; i < allData.length; i++) {
        if (allData[i][0] === data.key) {
            sheet.getRange(i + 1, 2).setValue(valueStr);
            sheet.getRange(i + 1, 3).setValue(nowISO());
            return true;
        }
    }
    sheet.appendRow([data.key, valueStr, nowISO()]);
    return true;
}

// --- RECYCLE BIN ---
function getRecycleBin() {
    var sheet = getSheet('RecycleBin');
    if (!sheet) return [];
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    return values.slice(1).map(function (row) {
        var parsedData;
        try { parsedData = JSON.parse(row[3]); } catch (e) { parsedData = row[3]; }
        return {
            binId: row[0],
            originalId: row[1],
            type: row[2],
            data: parsedData,
            deletedAt: row[4]
        };
    }).filter(function (item) { return item.binId; });
}

function addToRecycleBin(data) {
    var binId = genId('BIN-');
    var dataJson = JSON.stringify(data.data || {});
    getSheet('RecycleBin').appendRow([binId, data.originalId || '', data.type || '', dataJson, nowISO()]);
    return { binId: binId };
}

function deleteFromRecycleBin(data) {
    return deleteRow('RecycleBin', data.binId);
}

function emptyRecycleBin() {
    var sheet = getSheet('RecycleBin');
    if (sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
    return true;
}

// --- DASHBOARD STATS ---
function getDashboardStats() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var custSheet = ss.getSheetByName('Customers');
    var compSheet = ss.getSheetByName('Complaints');
    var invSheet = ss.getSheetByName('Invoices');
    var expSheet = ss.getSheetByName('Expenses');
    var txnSheet = ss.getSheetByName('Transactions');
    var bankSheet = ss.getSheetByName('BankAccounts');

    var totalCustomers = Math.max(0, (custSheet ? custSheet.getLastRow() : 1) - 1);
    var totalComplaints = Math.max(0, (compSheet ? compSheet.getLastRow() : 1) - 1);
    var totalInvoices = Math.max(0, (invSheet ? invSheet.getLastRow() : 1) - 1);

    var txnData = txnSheet ? txnSheet.getDataRange().getValues() : [];
    var totalReceived = 0;
    for (var i = 1; i < txnData.length; i++) {
        var type = txnData[i][3];
        var amount = Number(txnData[i][4]) || 0;
        if (type === 'IN' || type === 'cash-in') totalReceived += amount;
    }

    var expData = expSheet ? expSheet.getDataRange().getValues() : [];
    var totalExpenses = 0;
    for (var j = 1; j < expData.length; j++) {
        totalExpenses += Number(expData[j][2]) || 0;
    }

    var invData = invSheet ? invSheet.getDataRange().getValues() : [];
    var totalPending = 0;
    for (var k = 1; k < invData.length; k++) {
        if (invData[k][11] === 'Pending' || invData[k][11] === 'Unpaid') {
            totalPending += Number(invData[k][8]) || 0;
        }
    }

    var bankData = bankSheet ? bankSheet.getDataRange().getValues() : [];
    var cashInHand = 0;
    var bankBalance = 0;

    for (var b = 1; b < bankData.length; b++) {
        var accId = bankData[b][0];
        var accType = bankData[b][4];
        var openBal = Number(bankData[b][5]) || 0;

        var accBalance = openBal;
        for (var t = 1; t < txnData.length; t++) {
            if (txnData[t][2] === accId) {
                var txnType = txnData[t][3];
                var txnAmount = Number(txnData[t][4]) || 0;
                if (txnType === 'IN' || txnType === 'cash-in') accBalance += txnAmount;
                else if (txnType === 'OUT' || txnType === 'cash-out' || txnType === 'expense' || txnType === 'purchase') accBalance -= txnAmount;
            }
        }

        if (accType === 'Cash') cashInHand += accBalance;
        else bankBalance += accBalance;
    }

    return {
        totalCustomers: totalCustomers,
        totalComplaints: totalComplaints,
        totalInvoices: totalInvoices,
        totalReceived: totalReceived,
        totalPending: totalPending,
        totalExpenses: totalExpenses,
        netProfit: totalReceived - totalExpenses,
        cashInHand: Math.max(0, cashInHand),
        bankBalance: Math.max(0, bankBalance)
    };
}

// --- BULK DATA MIGRATION ---
function bulkImport(data) {
    var sheetName = data.sheetName;
    var rows = data.rows;
    var sheet = getSheet(sheetName);
    if (!sheet || !rows || !rows.length) return { imported: 0 };

    for (var i = 0; i < rows.length; i++) {
        sheet.appendRow(rows[i]);
    }
    return { imported: rows.length };
}

// ============================================
// 5. ACTION ROUTER MAP
// ============================================

var ACTIONS = {
    // Customers
    getCustomers: function () { return getCustomers(); },
    addCustomer: function (d) { return addCustomer(d); },
    updateCustomer: function (d) { return updateCustomer(d); },
    deleteCustomer: function (d) { return deleteCustomer(d); },
    updateCustomerLoyalty: function (d) { return updateCustomerLoyalty(d); },

    // Invoices
    getInvoices: function () { return getInvoices(); },
    addInvoice: function (d) { return addInvoice(d); },
    updateInvoice: function (d) { return updateInvoice(d); },
    deleteInvoice: function (d) { return deleteInvoice(d); },

    // Inventory
    getInventory: function () { return getInventory(); },
    addInventoryItem: function (d) { return addInventoryItem(d); },
    updateInventoryItem: function (d) { return updateInventoryItem(d); },
    deleteInventoryItem: function (d) { return deleteInventoryItem(d); },
    updateStock: function (d) { return updateStock(d); },
    bulkUpdateInventory: function (d) { return bulkUpdateInventory(d); },

    // Transactions
    getTransactions: function () { return getTransactions(); },
    addTransaction: function (d) { return addTransaction(d); },
    updateTransaction: function (d) { return updateTransaction(d); },
    deleteTransaction: function (d) { return deleteTransaction(d); },

    // Expenses
    getExpenses: function () { return getExpenses(); },
    addExpense: function (d) { return addExpense(d); },
    updateExpense: function (d) { return updateExpense(d); },
    deleteExpense: function (d) { return deleteExpense(d); },

    // Bank Accounts
    getBankAccounts: function () { return getBankAccounts(); },
    addBankAccount: function (d) { return addBankAccount(d); },
    deleteBankAccount: function (d) { return deleteBankAccount(d); },

    // Payment Receipts
    getPaymentReceipts: function () { return getPaymentReceipts(); },
    addPaymentReceipt: function (d) { return addPaymentReceipt(d); },
    updatePaymentReceipt: function (d) { return updatePaymentReceipt(d); },
    deletePaymentReceipt: function (d) { return deletePaymentReceipt(d); },

    // Complaints
    getComplaints: function () { return getComplaints(); },
    addComplaint: function (d) { return addComplaint(d); },
    updateComplaint: function (d) { return updateComplaint(d); },
    updateComplaintStatus: function (d) { return updateComplaintStatus(d); },
    deleteComplaint: function (d) { return deleteComplaint(d); },

    // Stock Wanting
    getStockWanting: function () { return getStockWanting(); },
    addStockWanting: function (d) { return addStockWanting(d); },
    deleteStockWanting: function (d) { return deleteStockWanting(d); },

    // Visitors
    getVisitors: function () { return getVisitors(); },
    addVisitor: function (d) { return addVisitor(d); },
    deleteVisitor: function (d) { return deleteVisitor(d); },

    // Service Reminders
    getReminders: function () { return getReminders(); },
    addReminder: function (d) { return addReminder(d); },
    updateReminder: function (d) { return updateReminder(d); },
    updateReminderStatus: function (d) { return updateReminderStatus(d); },
    deleteReminder: function (d) { return deleteReminder(d); },

    // Stock Transactions
    getStockTransactions: function () { return getStockTransactions(); },
    addStockTransaction: function (d) { return addStockTransaction(d); },

    // Salesmen
    getSalesmen: function () { return getSalesmen(); },
    addSalesman: function (d) { return addSalesman(d); },
    deleteSalesman: function (d) { return deleteSalesman(d); },

    // Users
    getUsers: function () { return getUsers(); },
    addUser: function (d) { return addUser(d); },
    updateUser: function (d) { return updateUser(d); },
    deleteUser: function (d) { return deleteUser(d); },
    toggleUserStatus: function (d) { return toggleUserStatus(d); },

    // Config
    getConfig: function (d) { return getConfig(d); },
    setConfig: function (d) { return setConfig(d); },

    // Recycle Bin
    getRecycleBin: function () { return getRecycleBin(); },
    addToRecycleBin: function (d) { return addToRecycleBin(d); },
    deleteFromRecycleBin: function (d) { return deleteFromRecycleBin(d); },
    emptyRecycleBin: function () { return emptyRecycleBin(); },

    // Dashboard
    getDashboardStats: function () { return getDashboardStats(); },

    // Bulk Migration
    bulkImport: function (d) { return bulkImport(d); }
};
