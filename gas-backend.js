/**
 * MOTO GEAR SRK - GOOGLE APPS SCRIPT BACKEND
 * ============================================
 * Paste this ENTIRE file into Code.gs in your Google Apps Script Editor.
 * Then: Deploy → New Deployment → Web App → Execute as: Me → Who has access: Anyone
 * Copy the Web App URL and paste it into googleSheetsService.ts
 *
 * SHEET LAYOUT (13 sheets):
 *   Customers, Invoices, Inventory (+WantedQty col), Transactions (+ReceiptNumber col),
 *   BankAccounts, Complaints, Visitors, ServiceReminders,
 *   Salesmen, Users, Config, RecycleBin, PickupRequests
 *
 * MERGED (no separate sheets needed):
 *   Expenses       → Transactions  (type = 'expense')
 *   PaymentReceipts→ Transactions  (type = 'receipt')
 *   StockTransactions→Transactions (type = 'stock-in' | 'stock-out')
 *   StockWanting   → Inventory     (WantedQty column)
 */
// ============================================
// 1. INITIALIZATION - RUN THIS ONCE
// ============================================
const _s = (str) => str.split(',');
function initProject() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = {
        Customers:       _s('ID,Name,Phone,BikeNumber,City,Email,Address,GSTIN,LoyaltyPoints,CreatedAt'),
        Invoices:        _s('ID,ComplaintID,BikeNumber,CustomerName,CustomerPhone,Details,Items_JSON,EstimatedCost,FinalAmount,TaxAmount,SubTotal,PaymentStatus,AccountID,PaymentMode,Date,OdometerReading,DocType,ServiceReminderDate,PayCollCash,PayCollUPI,PayCollUPIAcctID'),
        Inventory:       _s('ID,Name,Category,Stock,UnitPrice,PurchasePrice,ItemCode,GSTRate,HSN,LastUpdated,WantedQty'),
        Transactions:    _s('ID,EntityID,AccountID,Type,Amount,PaymentMode,Date,Description,Category,Status,ChequeNumber,PartyName,BankName,Items_JSON,ReceiptNumber'),
        BankAccounts:    _s('ID,Name,BankName,AccountNumber,Type,OpeningBalance,CreatedAt'),
        Complaints:      _s('ID,BikeNumber,CustomerName,CustomerPhone,Details,PhotoUrls,EstimatedCost,Status,CreatedAt,DueDate,OdometerReading'),
        Visitors:        _s('ID,Name,BikeNumber,Phone,Remarks,Type,PhotoUrls,CreatedAt'),
        ServiceReminders:_s('ID,BikeNumber,CustomerName,Phone,ReminderDate,ServiceType,Status,LastNotified,Message,ServiceDate'),
        Salesmen:        _s('ID,Name,Phone,Target,SalesCount,TotalSalesValue,JoinDate,Status'),
        Users:           _s('ID,Username,Password,Role,Name,Phone,CreatedAt,IsActive'),
        Config:          _s('Key,Value,UpdatedAt'),
        RecycleBin:      _s('BinID,OriginalID,Type,Data_JSON,DeletedAt'),
        PickupRequests:  _s('ID,CustomerName,CustomerPhone,BikeNumber,IssueDescription,LocationLink,Location_JSON,Status,AssignedEmployeeID,AssignedEmployeeName,EmployeeLocation_JSON,Notes,CreatedAt,UpdatedAt')
    };
    for (const name in sheets) {
        let sheet = ss.getSheetByName(name);
        if (!sheet) sheet = ss.insertSheet(name);
        const headers = sheets[name];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8EAF6');
        sheet.setFrozenRows(1);
    }
    const bankSheet = ss.getSheetByName('BankAccounts');
    if (bankSheet.getLastRow() <= 1) {
        bankSheet.appendRow(['CASH-01', 'CASH IN HAND', '', '', 'Cash', 0, new Date().toISOString()]);
    }
    return 'Project initialized with ' + Object.keys(sheets).length + ' sheets (13 total, 4 merged)!';
}
// ============================================
// 2. HTTP ENTRY POINTS
// ============================================
function doGet(e) {
    // For testing - returns a simple JSON status
    const output = { status: 'ok', message: 'Moto Gear SRK API is running', timestamp: new Date().toISOString() };
    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000); // Wait up to 10 seconds for concurrent writes
        const payload = JSON.parse(e.postData.contents);
        const action = payload.action;
        const data = payload.data;
        if (!ACTIONS[action]) {
            return jsonResponse({ error: 'Unknown action: ' + action });
        }
        const result = ACTIONS[action](data);
        return jsonResponse({ success: true, data: result });
    }
    catch (error) {
        return jsonResponse({ error: error.message || 'Unknown error' });
    }
    finally {
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
    const sheet = getSheet(sheetName);
    if (!sheet)
        return [];
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1)
        return [];
    const headers = values[0];
    const rows = values.slice(1);
    return rows.map((row, rowIndex) => {
        const obj = {};
        let hasData = false;
        fieldMap.forEach((key, i) => {
            if (i < row.length) {
                let val = row[i];
                // Check if value is not empty
                if (val !== null && val !== undefined && val !== '') {
                    hasData = true;
                }
                // Auto-convert JSON fields
                if (key.endsWith('_JSON') || key === 'items') {
                    try {
                        val = JSON.parse(val || '[]');
                    }
                    catch {
                        val = key === 'items' ? [] : val;
                    }
                }
                // Auto-convert arrays stored as comma-separated
                if (key === 'photoUrls' && typeof val === 'string') {
                    val = val ? val.split(',').map((s) => s.trim()) : [];
                }
                // Auto-convert booleans
                if (val === 'TRUE' || val === true)
                    val = true;
                if (val === 'FALSE' || val === false)
                    val = false;
                obj[key] = val;
            }
        });
        // Auto-assign an ID if it's missing but row has data
        if (!obj.id && hasData) {
            obj.id = 'AUTO-' + (rowIndex + 2); // Row 1 is header, so data starts at row 2
        }
        return obj;
    }).filter((item) => item && item.id); // Skip empty rows
}
function findRowIndex(sheetName, id, colIndex = 0) {
    const sheet = getSheet(sheetName);
    if (!sheet)
        return null;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][colIndex] && data[i][colIndex].toString() === id.toString()) {
            return i + 1; // 1-indexed row
        }
    }
    return null;
}
function deleteRow(sheetName, id, colIndex = 0) {
    const row = findRowIndex(sheetName, id, colIndex);
    if (row) {
        getSheet(sheetName).deleteRow(row);
        return true;
    }
    return false;
}
function updateRow(sheetName, id, values, colIndex = 0) {
    const row = findRowIndex(sheetName, id, colIndex);
    if (row) {
        const sheet = getSheet(sheetName);
        sheet.getRange(row, 1, 1, values.length).setValues([values]);
        return true;
    }
    return false;
}
function updateCell(sheetName, id, colNum, value, idColIndex = 0) {
    const row = findRowIndex(sheetName, id, idColIndex);
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
const CUSTOMER_FIELDS = ['id', 'name', 'phone', 'bikeNumber', 'city', 'email', 'address', 'gstin', 'loyaltyPoints', 'createdAt'];
function getCustomers() { return getSheetData('Customers', CUSTOMER_FIELDS); }
function addCustomer(data) {
    const id = data.id || genId('CUST-');
    const row = [id, data.name || '', data.phone || '', data.bikeNumber || '', data.city || '', data.email || '', data.address || '', data.gstin || '', data.loyaltyPoints || 0, data.createdAt || nowISO()];
    getSheet('Customers').appendRow(row);
    return { ...data, id, loyaltyPoints: data.loyaltyPoints || 0, createdAt: data.createdAt || nowISO() };
}
function updateCustomer(data) {
    const row = [data.id, data.name || '', data.phone || '', data.bikeNumber || '', data.city || '', data.email || '', data.address || '', data.gstin || '', data.loyaltyPoints || 0, data.createdAt || nowISO()];
    return updateRow('Customers', data.id, row);
}
function deleteCustomer(data) { return deleteRow('Customers', data.id); }
function updateCustomerLoyalty(data) {
    return updateCell('Customers', data.id, 9, data.loyaltyPoints);
}
// --- INVOICES ---
const INVOICE_FIELDS = ['id', 'complaintId', 'bikeNumber', 'customerName', 'customerPhone', 'details', 'items', 'estimatedCost', 'finalAmount', 'taxAmount', 'subTotal', 'paymentStatus', 'accountId', 'paymentMode', 'date', 'odometerReading', 'docType', 'serviceReminderDate', 'payCollCash', 'payCollUPI', 'payCollUPIAcctID'];
function getInvoices() {
    const raw = getSheetData('Invoices', INVOICE_FIELDS);
    // Reconstruct paymentCollections nested object
    return raw.map((inv) => ({
        ...inv,
        paymentCollections: {
            cash: Number(inv.payCollCash) || 0,
            upi: Number(inv.payCollUPI) || 0,
            upiAccountId: inv.payCollUPIAcctID || ''
        }
    }));
}
function addInvoice(data) {
    const id = data.id || ((data.docType === 'Estimate' ? 'EST-' : 'INV-') + genId(''));
    const itemsJson = JSON.stringify(data.items || []);
    const pc = data.paymentCollections || {};
    const row = [id, data.complaintId || '', data.bikeNumber || '', data.customerName || '', data.customerPhone || '', data.details || '', itemsJson, data.estimatedCost || 0, data.finalAmount || 0, data.taxAmount || 0, data.subTotal || 0, data.paymentStatus || 'Pending', data.accountId || '', data.paymentMode || '', data.date || nowISO(), data.odometerReading || '', data.docType || 'Sale', data.serviceReminderDate || '', pc.cash || 0, pc.upi || 0, pc.upiAccountId || ''];
    getSheet('Invoices').appendRow(row);
    return { ...data, id, date: data.date || nowISO() };
}
function updateInvoice(data) {
    const itemsJson = JSON.stringify(data.items || []);
    const pc = data.paymentCollections || {};
    const row = [data.id, data.complaintId || '', data.bikeNumber || '', data.customerName || '', data.customerPhone || '', data.details || '', itemsJson, data.estimatedCost || 0, data.finalAmount || 0, data.taxAmount || 0, data.subTotal || 0, data.paymentStatus || 'Pending', data.accountId || '', data.paymentMode || '', data.date || nowISO(), data.odometerReading || '', data.docType || 'Sale', data.serviceReminderDate || '', pc.cash || 0, pc.upi || 0, pc.upiAccountId || ''];
    return updateRow('Invoices', data.id, row);
}
function deleteInvoice(data) { return deleteRow('Invoices', data.id); }
// --- INVENTORY (now includes WantedQty col 11) ---
// Columns: ID, Name, Category, Stock, UnitPrice, PurchasePrice, ItemCode, GSTRate, HSN, LastUpdated, WantedQty
const INVENTORY_FIELDS = ['id', 'name', 'category', 'stock', 'unitPrice', 'purchasePrice', 'itemCode', 'gstRate', 'hsn', 'lastUpdated', 'wantedQty'];
function getInventory() { return getSheetData('Inventory', INVENTORY_FIELDS); }
function addInventoryItem(data) {
    const id = data.id || genId('SKU-');
    const row = [id, data.name || '', data.category || '', data.stock || 0, data.unitPrice || 0, data.purchasePrice || 0, data.itemCode || '', data.gstRate || 0, data.hsn || '', data.lastUpdated || nowISO(), data.wantedQty || 0];
    getSheet('Inventory').appendRow(row);
    return { ...data, id, lastUpdated: data.lastUpdated || nowISO() };
}
function updateInventoryItem(data) {
    const row = [data.id, data.name || '', data.category || '', data.stock || 0, data.unitPrice || 0, data.purchasePrice || 0, data.itemCode || '', data.gstRate || 0, data.hsn || '', nowISO(), data.wantedQty || 0];
    return updateRow('Inventory', data.id, row);
}
function deleteInventoryItem(data) { return deleteRow('Inventory', data.id); }
function updateStock(data) {
    const row = findRowIndex('Inventory', data.id);
    if (row) {
        const sheet = getSheet('Inventory');
        const currentStock = Number(sheet.getRange(row, 4).getValue()) || 0;
        sheet.getRange(row, 4).setValue(currentStock + (data.delta || 0));
        sheet.getRange(row, 10).setValue(nowISO());
        // Also log as a stock transaction in Transactions sheet
        addTransaction({ id: genId('ST-'), entityId: data.id, accountId: '', type: data.delta > 0 ? 'stock-in' : 'stock-out', amount: 0, paymentMode: '', date: nowISO(), description: data.note || '', category: 'stock', status: 'completed' });
        return true;
    }
    return false;
}
function bulkUpdateInventory(data) {
    const sheet = getSheet('Inventory');
    const allData = sheet.getDataRange().getValues();
    let updated = 0, created = 0;
    for (const item of (data.items || [])) {
        let found = false;
        for (let i = 1; i < allData.length; i++) {
            if (allData[i][1]?.toString().toLowerCase() === item.name?.toString().toLowerCase() ||
                allData[i][6]?.toString().toLowerCase() === item.itemCode?.toString().toLowerCase()) {
                const rowNum = i + 1;
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
            const id = genId('SKU-');
            sheet.appendRow([id, item.name || '', item.category || '', item.stock || 0, item.unitPrice || 0, item.purchasePrice || 0, item.itemCode || '', item.gstRate || 0, item.hsn || '', nowISO(), 0]);
            created++;
        }
    }
    return { updated, created };
}
// --- STOCK WANTING (delegated → Inventory.wantedQty, col 11) ---
function getStockWanting() {
    return getInventory().filter(i => (i.wantedQty || 0) > 0).map(i => ({
        id: i.id, partNumber: i.itemCode || '', itemName: i.name, quantity: i.wantedQty, rate: i.unitPrice, createdAt: i.lastUpdated
    }));
}
function setWantedQty(data) {
    return updateCell('Inventory', data.id, 11, data.wantedQty || 0);
}
// --- TRANSACTIONS (now absorbs Expenses, PaymentReceipts, StockTransactions) ---
// Columns: ID, EntityID, AccountID, Type, Amount, PaymentMode, Date, Description,
//          Category, Status, ChequeNumber, PartyName, BankName, Items_JSON, ReceiptNumber
const TXN_FIELDS = ['id', 'entityId', 'accountId', 'type', 'amount', 'paymentMode', 'date', 'description', 'category', 'status', 'chequeNumber', 'partyName', 'bankName', 'items', 'receiptNumber'];
function getTransactions() { return getSheetData('Transactions', TXN_FIELDS); }
function addTransaction(data) {
    const id = data.id || genId('TXN-');
    const itemsJson = JSON.stringify(data.items || []);
    const row = [id, data.entityId || '', data.accountId || '', data.type || '', data.amount || 0, data.paymentMode || '', data.date || nowISO(), data.description || '', data.category || '', data.status || 'completed', data.chequeNumber || '', data.partyName || '', data.bankName || '', itemsJson, data.receiptNumber || ''];
    getSheet('Transactions').appendRow(row);
    return { ...data, id };
}
function updateTransaction(data) {
    const itemsJson = JSON.stringify(data.items || []);
    const row = [data.id, data.entityId || '', data.accountId || '', data.type || '', data.amount || 0, data.paymentMode || '', data.date || nowISO(), data.description || '', data.category || '', data.status || 'completed', data.chequeNumber || '', data.partyName || '', data.bankName || '', itemsJson, data.receiptNumber || ''];
    return updateRow('Transactions', data.id, row);
}
function deleteTransaction(data) { return deleteRow('Transactions', data.id); }
// --- EXPENSES (delegated → Transactions with type='expense') ---
function getExpenses() { return getTransactions().filter(t => t.type === 'expense'); }
function addExpense(data) {
    return addTransaction({ ...data, id: data.id || genId('EXP-'), type: 'expense', status: data.status || 'completed' });
}
function updateExpense(data) { return updateTransaction({ ...data, type: 'expense' }); }
function deleteExpense(data) { return deleteTransaction(data); }
// --- BANK ACCOUNTS ---
const BANK_FIELDS = ['id', 'name', 'bankName', 'accountNumber', 'type', 'openingBalance', 'createdAt'];
function getBankAccounts() { return getSheetData('BankAccounts', BANK_FIELDS); }
function addBankAccount(data) {
    const id = data.id || genId('BANK-');
    const row = [id, data.name || '', data.bankName || '', data.accountNumber || '', data.type || 'Savings', data.openingBalance || 0, data.createdAt || nowISO()];
    getSheet('BankAccounts').appendRow(row);
    return { ...data, id, createdAt: data.createdAt || nowISO() };
}
function deleteBankAccount(data) { return deleteRow('BankAccounts', data.id); }
// --- PAYMENT RECEIPTS (delegated → Transactions with type='receipt') ---
// cash/upi split stored in Items_JSON; receiptNumber in ReceiptNumber col
function getPaymentReceipts() {
    return getTransactions()
        .filter(t => t.type === 'receipt')
        .map(t => {
            const split = (() => { try { return Array.isArray(t.items) ? t.items[0] || {} : {}; } catch { return {}; } })();
            return { id: t.id, receiptNumber: t.receiptNumber || '', customerId: t.entityId || '', customerName: t.partyName || '', customerPhone: t.chequeNumber || '', bikeNumber: t.bankName || '', cashAmount: split.cash || 0, upiAmount: split.upi || 0, totalAmount: t.amount || 0, date: t.date, description: t.description || '', createdAt: t.date };
        });
}
function addPaymentReceipt(data) {
    const id = data.id || genId('PR-');
    const txns = getTransactions().filter(t => t.type === 'receipt');
    const receiptNumber = data.receiptNumber || ('PR-' + (txns.length + 1).toString().padStart(4, '0'));
    const splitJson = JSON.stringify([{ cash: data.cashAmount || 0, upi: data.upiAmount || 0 }]);
    return addTransaction({ id, entityId: data.customerId || '', accountId: '', type: 'receipt', amount: data.totalAmount || 0, paymentMode: '', date: data.date || nowISO(), description: data.description || '', category: 'receipt', status: 'completed', chequeNumber: data.customerPhone || '', partyName: data.customerName || '', bankName: data.bikeNumber || '', items: [{ cash: data.cashAmount || 0, upi: data.upiAmount || 0 }], receiptNumber });
}
function updatePaymentReceipt(data) {
    return updateTransaction({ ...data, type: 'receipt', entityId: data.customerId || '', partyName: data.customerName || '', chequeNumber: data.customerPhone || '', bankName: data.bikeNumber || '', amount: data.totalAmount || 0, items: [{ cash: data.cashAmount || 0, upi: data.upiAmount || 0 }] });
}
function deletePaymentReceipt(data) { return deleteTransaction(data); }
// --- COMPLAINTS (JOB CARDS) ---
const COMPLAINT_FIELDS = ['id', 'bikeNumber', 'customerName', 'customerPhone', 'details', 'photoUrls', 'estimatedCost', 'status', 'createdAt', 'dueDate', 'odometerReading', 'assignedMechanicId', 'assignedMechanicName'];
function getComplaints() { return getSheetData('Complaints', COMPLAINT_FIELDS); }
function addComplaint(data) {
    const id = data.id || genId('CMP-');
    const photos = Array.isArray(data.photoUrls) ? data.photoUrls.join(',') : (data.photoUrls || '');
    const row = [id, data.bikeNumber || '', data.customerName || '', data.customerPhone || '', data.details || '', photos, data.estimatedCost || 0, data.status || 'Pending', data.createdAt || nowISO(), data.dueDate || '', data.odometerReading || '', data.assignedMechanicId || '', data.assignedMechanicName || ''];
    getSheet('Complaints').appendRow(row);
    return { ...data, id, status: data.status || 'Pending', createdAt: data.createdAt || nowISO() };
}
function updateComplaint(data) {
    const photos = Array.isArray(data.photoUrls) ? data.photoUrls.join(',') : (data.photoUrls || '');
    const row = [data.id, data.bikeNumber || '', data.customerName || '', data.customerPhone || '', data.details || '', photos, data.estimatedCost || 0, data.status || 'Pending', data.createdAt || '', data.dueDate || '', data.odometerReading || '', data.assignedMechanicId || '', data.assignedMechanicName || ''];
    return updateRow('Complaints', data.id, row);
}
function updateComplaintStatus(data) {
    return updateCell('Complaints', data.id, 8, data.status);
}
function deleteComplaint(data) { return deleteRow('Complaints', data.id); }
// --- PICKUP REQUESTS ---
const PICKUP_FIELDS = ['id', 'customerName', 'customerPhone', 'bikeNumber', 'issueDescription', 'locationLink', 'location', 'status', 'assignedEmployeeId', 'assignedEmployeeName', 'employeeLocation', 'notes', 'createdAt', 'updatedAt'];
function getPickupRequests() {
    const raw = getSheetData('PickupRequests', PICKUP_FIELDS);
    return raw.map((r) => {
        // Parse location JSON fields stored as plain strings (not _JSON suffix)
        if (r.location && typeof r.location === 'string') {
            try {
                r.location = JSON.parse(r.location);
            }
            catch {
                r.location = null;
            }
        }
        if (r.employeeLocation && typeof r.employeeLocation === 'string') {
            try {
                r.employeeLocation = JSON.parse(r.employeeLocation);
            }
            catch {
                r.employeeLocation = null;
            }
        }
        return r;
    });
}
function addPickupRequest(data) {
    const id = data.id || genId('PKP-');
    const locationJson = data.location ? JSON.stringify(data.location) : '';
    const empLocJson = data.employeeLocation ? JSON.stringify(data.employeeLocation) : '';
    const row = [id, data.customerName || '', data.customerPhone || '', data.bikeNumber || '', data.issueDescription || '', data.locationLink || '', locationJson, data.status || 'Pending', data.assignedEmployeeId || '', data.assignedEmployeeName || '', empLocJson, data.notes || '', data.createdAt || nowISO(), data.updatedAt || nowISO()];
    getSheet('PickupRequests').appendRow(row);
    return { ...data, id, status: data.status || 'Pending', createdAt: data.createdAt || nowISO(), updatedAt: data.updatedAt || nowISO() };
}
function updatePickupRequest(data) {
    const locationJson = data.location ? JSON.stringify(data.location) : '';
    const empLocJson = data.employeeLocation ? JSON.stringify(data.employeeLocation) : '';
    const row = [data.id, data.customerName || '', data.customerPhone || '', data.bikeNumber || '', data.issueDescription || '', data.locationLink || '', locationJson, data.status || 'Pending', data.assignedEmployeeId || '', data.assignedEmployeeName || '', empLocJson, data.notes || '', data.createdAt || nowISO(), nowISO()];
    return updateRow('PickupRequests', data.id, row);
}
function deletePickupRequest(data) { return deleteRow('PickupRequests', data.id); }
// --- STOCK WANTING ---
const SW_FIELDS = ['id', 'partNumber', 'itemName', 'quantity', 'rate', 'createdAt'];
function getStockWanting() { return getSheetData('StockWanting', SW_FIELDS); }
function addStockWanting(data) {
    const id = data.id || genId('SW-');
    const row = [id, data.partNumber || '', data.itemName || '', data.quantity || 0, data.rate || 0, data.createdAt || nowISO()];
    getSheet('StockWanting').appendRow(row);
    return { ...data, id, createdAt: data.createdAt || nowISO() };
}
function deleteStockWanting(data) { return deleteRow('StockWanting', data.id); }
// --- VISITORS ---
const VISITOR_FIELDS = ['id', 'name', 'bikeNumber', 'phone', 'remarks', 'type', 'photoUrls', 'createdAt'];
function getVisitors() { return getSheetData('Visitors', VISITOR_FIELDS); }
function addVisitor(data) {
    const id = data.id || genId('VIS-');
    const photos = Array.isArray(data.photoUrls) ? data.photoUrls.join(',') : (data.photoUrls || '');
    const row = [id, data.name || '', data.bikeNumber || '', data.phone || '', data.remarks || '', data.type || 'Other', photos, data.createdAt || nowISO()];
    getSheet('Visitors').appendRow(row);
    return { ...data, id, createdAt: data.createdAt || nowISO() };
}
function deleteVisitor(data) { return deleteRow('Visitors', data.id); }
// --- SERVICE REMINDERS ---
const REMINDER_FIELDS = ['id', 'bikeNumber', 'customerName', 'phone', 'reminderDate', 'serviceType', 'status', 'lastNotified', 'message', 'serviceDate'];
function getReminders() { return getSheetData('ServiceReminders', REMINDER_FIELDS); }
function addReminder(data) {
    const id = data.id || genId('REM-');
    const row = [id, data.bikeNumber || '', data.customerName || '', data.phone || '', data.reminderDate || '', data.serviceType || '', data.status || 'Pending', '', data.message || '', data.serviceDate || ''];
    getSheet('ServiceReminders').appendRow(row);
    return { ...data, id, status: data.status || 'Pending' };
}
function updateReminder(data) {
    const row = [data.id, data.bikeNumber || '', data.customerName || '', data.phone || '', data.reminderDate || '', data.serviceType || '', data.status || 'Pending', data.lastNotified || '', data.message || '', data.serviceDate || ''];
    return updateRow('ServiceReminders', data.id, row);
}
function updateReminderStatus(data) {
    return updateCell('ServiceReminders', data.id, 7, data.status);
}
function deleteReminder(data) { return deleteRow('ServiceReminders', data.id); }
// --- STOCK TRANSACTIONS (delegated → Transactions with type='stock-in'|'stock-out') ---
function getStockTransactions() {
    return getTransactions()
        .filter(t => t.type === 'stock-in' || t.type === 'stock-out')
        .map(t => ({ id: t.id, itemId: t.entityId, type: t.type === 'stock-in' ? 'IN' : 'OUT', quantity: t.amount, date: t.date, note: t.description }));
}
function addStockTransaction(data) {
    return addTransaction({ id: data.id || genId('ST-'), entityId: data.itemId || '', accountId: '', type: data.type === 'IN' ? 'stock-in' : 'stock-out', amount: data.quantity || 0, paymentMode: '', date: data.date || nowISO(), description: data.note || '', category: 'stock', status: 'completed' });
}
// --- SALESMEN ---
const SALESMAN_FIELDS = ['id', 'name', 'phone', 'target', 'salesCount', 'totalSalesValue', 'joinDate', 'status'];
function getSalesmen() { return getSheetData('Salesmen', SALESMAN_FIELDS); }
function addSalesman(data) {
    const id = data.id || genId('SM-');
    const row = [id, data.name || '', data.phone || '', data.target || 0, data.salesCount || 0, data.totalSalesValue || 0, data.joinDate || nowISO(), data.status || 'Available'];
    getSheet('Salesmen').appendRow(row);
    return { ...data, id, salesCount: data.salesCount || 0, totalSalesValue: data.totalSalesValue || 0 };
}
function deleteSalesman(data) { return deleteRow('Salesmen', data.id); }
// --- USERS ---
const USER_FIELDS = ['id', 'username', 'password', 'role', 'name', 'phone', 'createdAt', 'isActive'];
function getUsers() { return getSheetData('Users', USER_FIELDS); }
function addUser(data) {
    const id = data.id || genId('USR-');
    const row = [id, data.username || '', data.password || '', data.role || 'employee', data.name || '', data.phone || '', data.createdAt || nowISO(), data.isActive !== false];
    getSheet('Users').appendRow(row);
    return { ...data, id, createdAt: data.createdAt || nowISO(), isActive: data.isActive !== false };
}
function updateUser(data) {
    const row = [data.id, data.username || '', data.password || '', data.role || 'employee', data.name || '', data.phone || '', data.createdAt || '', data.isActive !== false];
    return updateRow('Users', data.id, row);
}
function deleteUser(data) { return deleteRow('Users', data.id); }
function toggleUserStatus(data) {
    const row = findRowIndex('Users', data.id);
    if (row) {
        const sheet = getSheet('Users');
        const current = sheet.getRange(row, 8).getValue();
        sheet.getRange(row, 8).setValue(!current);
        return true;
    }
    return false;
}
// --- CONFIG (Settings + Permissions) ---
function getConfig(data) {
    const sheet = getSheet('Config');
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === data.key) {
            try {
                return JSON.parse(allData[i][1]);
            }
            catch {
                return allData[i][1];
            }
        }
    }
    return null;
}
function setConfig(data) {
    const sheet = getSheet('Config');
    const allData = sheet.getDataRange().getValues();
    const valueStr = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
    for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === data.key) {
            sheet.getRange(i + 1, 2).setValue(valueStr);
            sheet.getRange(i + 1, 3).setValue(nowISO());
            return true;
        }
    }
    // Key doesn't exist, insert it
    sheet.appendRow([data.key, valueStr, nowISO()]);
    return true;
}
// --- RECYCLE BIN ---
function getRecycleBin() {
    const sheet = getSheet('RecycleBin');
    if (!sheet)
        return [];
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1)
        return [];
    return values.slice(1).map((row) => ({
        binId: row[0],
        originalId: row[1],
        type: row[2],
        data: (() => { try {
            return JSON.parse(row[3]);
        }
        catch {
            return row[3];
        } })(),
        deletedAt: row[4]
    })).filter((item) => item.binId);
}
function addToRecycleBin(data) {
    const binId = genId('BIN-');
    const dataJson = JSON.stringify(data.data || {});
    getSheet('RecycleBin').appendRow([binId, data.originalId || '', data.type || '', dataJson, nowISO()]);
    return { binId };
}
function deleteFromRecycleBin(data) {
    return deleteRow('RecycleBin', data.binId);
}
function emptyRecycleBin() {
    const sheet = getSheet('RecycleBin');
    if (sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
    return true;
}
// --- DASHBOARD STATS ---
function getDashboardStats() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const custSheet = ss.getSheetByName('Customers');
    const compSheet = ss.getSheetByName('Complaints');
    const invSheet = ss.getSheetByName('Invoices');
    const expSheet = ss.getSheetByName('Expenses');
    const txnSheet = ss.getSheetByName('Transactions');
    const bankSheet = ss.getSheetByName('BankAccounts');
    const totalCustomers = Math.max(0, (custSheet?.getLastRow() || 1) - 1);
    const totalComplaints = Math.max(0, (compSheet?.getLastRow() || 1) - 1);
    const totalInvoices = Math.max(0, (invSheet?.getLastRow() || 1) - 1);
    // Calculate from Transactions
    const txnData = txnSheet ? txnSheet.getDataRange().getValues() : [];
    let totalReceived = 0;
    for (let i = 1; i < txnData.length; i++) {
        const type = txnData[i][3]; // Type column
        const amount = Number(txnData[i][4]) || 0;
        if (type === 'IN' || type === 'cash-in')
            totalReceived += amount;
    }
    // Calculate from Expenses
    const expData = expSheet ? expSheet.getDataRange().getValues() : [];
    let totalExpenses = 0;
    for (let i = 1; i < expData.length; i++) {
        totalExpenses += Number(expData[i][2]) || 0;
    }
    // Calculate pending from Invoices
    const invData = invSheet ? invSheet.getDataRange().getValues() : [];
    let totalPending = 0;
    for (let i = 1; i < invData.length; i++) {
        if (invData[i][11] === 'Pending' || invData[i][11] === 'Unpaid') { // PaymentStatus column
            totalPending += Number(invData[i][8]) || 0;
        }
    }
    // Calculate account balances
    const bankData = bankSheet ? bankSheet.getDataRange().getValues() : [];
    let cashInHand = 0;
    let bankBalance = 0;
    for (let b = 1; b < bankData.length; b++) {
        const accId = bankData[b][0];
        const accType = bankData[b][4];
        const openBal = Number(bankData[b][5]) || 0;
        let accBalance = openBal;
        for (let t = 1; t < txnData.length; t++) {
            if (txnData[t][2] === accId) { // AccountID column
                const type = txnData[t][3];
                const amount = Number(txnData[t][4]) || 0;
                if (type === 'IN' || type === 'cash-in')
                    accBalance += amount;
                else if (type === 'OUT' || type === 'cash-out' || type === 'expense' || type === 'purchase')
                    accBalance -= amount;
            }
        }
        if (accType === 'Cash')
            cashInHand += accBalance;
        else
            bankBalance += accBalance;
    }
    return {
        totalCustomers,
        totalComplaints,
        totalInvoices,
        totalReceived,
        totalPending,
        totalExpenses,
        netProfit: totalReceived - totalExpenses,
        cashInHand: Math.max(0, cashInHand),
        bankBalance: Math.max(0, bankBalance)
    };
}
// --- BULK DATA MIGRATION ---
function bulkImport(data) {
    const sheetName = data.sheetName;
    const rows = data.rows;
    const sheet = getSheet(sheetName);
    if (!sheet || !rows || !rows.length) return { imported: 0 };
    for (const row of rows) { sheet.appendRow(row); }
    return { imported: rows.length };
}
// --- GET ALL DATA (single batch call) ---
function getAllData() {
    return {
        customers:       getCustomers(),
        invoices:        getInvoices(),
        inventory:       getInventory(),       // includes wantedQty
        transactions:    getTransactions(),    // includes expenses, receipts, stock txns
        bankAccounts:    getBankAccounts(),
        complaints:      getComplaints(),
        visitors:        getVisitors(),
        reminders:       getReminders(),
        salesmen:        getSalesmen(),
        users:           getUsers(),
        pickupRequests:  getPickupRequests(),
    };
}
// --- ONE-TIME MIGRATION HELPER (run once from GAS editor, then ignore) ---
// Copies data from old separate sheets into the merged Transactions / Inventory sheets.
function migrateToMerged() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let log = [];
    // 1. Migrate Expenses sheet → Transactions (type='expense')
    const expSheet = ss.getSheetByName('Expenses');
    if (expSheet && expSheet.getLastRow() > 1) {
        const rows = expSheet.getDataRange().getValues().slice(1);
        rows.forEach(r => {
            if (!r[0]) return;
            addTransaction({ id: r[0], entityId: '', accountId: r[7] || '', type: 'expense', amount: r[2] || 0, paymentMode: r[5] || '', date: r[4] ? new Date(r[4]).toISOString() : nowISO(), description: r[1] || '', category: r[3] || '', status: 'completed' });
        });
        log.push('Expenses: ' + rows.length + ' rows migrated');
    }
    // 2. Migrate PaymentReceipts sheet → Transactions (type='receipt')
    const prSheet = ss.getSheetByName('PaymentReceipts');
    if (prSheet && prSheet.getLastRow() > 1) {
        const rows = prSheet.getDataRange().getValues().slice(1);
        rows.forEach(r => {
            if (!r[0]) return;
            addTransaction({ id: r[0], entityId: r[2] || '', accountId: '', type: 'receipt', amount: r[8] || 0, paymentMode: '', date: r[9] ? new Date(r[9]).toISOString() : nowISO(), description: r[10] || '', category: 'receipt', status: 'completed', chequeNumber: r[4] || '', partyName: r[3] || '', bankName: r[5] || '', items: [{ cash: r[6] || 0, upi: r[7] || 0 }], receiptNumber: r[1] || '' });
        });
        log.push('PaymentReceipts: ' + rows.length + ' rows migrated');
    }
    // 3. Migrate StockTransactions sheet → Transactions (type='stock-in'|'stock-out')
    const stSheet = ss.getSheetByName('StockTransactions');
    if (stSheet && stSheet.getLastRow() > 1) {
        const rows = stSheet.getDataRange().getValues().slice(1);
        rows.forEach(r => {
            if (!r[0]) return;
            addTransaction({ id: r[0], entityId: r[1] || '', accountId: '', type: r[2] === 'IN' ? 'stock-in' : 'stock-out', amount: r[3] || 0, paymentMode: '', date: r[4] ? new Date(r[4]).toISOString() : nowISO(), description: r[5] || '', category: 'stock', status: 'completed' });
        });
        log.push('StockTransactions: ' + rows.length + ' rows migrated');
    }
    // 4. Migrate StockWanting → Inventory.WantedQty
    const swSheet = ss.getSheetByName('StockWanting');
    if (swSheet && swSheet.getLastRow() > 1) {
        const rows = swSheet.getDataRange().getValues().slice(1);
        const invSheet = ss.getSheetByName('Inventory');
        const invData = invSheet.getDataRange().getValues();
        rows.forEach(r => {
            if (!r[0]) return;
            const itemName = (r[2] || '').toString().toLowerCase();
            for (let i = 1; i < invData.length; i++) {
                if (invData[i][1]?.toString().toLowerCase() === itemName) {
                    invSheet.getRange(i + 1, 11).setValue(r[3] || 0);
                    break;
                }
            }
        });
        log.push('StockWanting: ' + rows.length + ' items mapped to Inventory.WantedQty');
    }
    return log.join('\n') || 'Nothing to migrate (old sheets not found or empty)';
}
// ============================================
// 5. ACTION ROUTER MAP
// ============================================
const ACTIONS = {
    // Customers
    getCustomers:          () => getCustomers(),
    addCustomer:           (d) => addCustomer(d),
    updateCustomer:        (d) => updateCustomer(d),
    deleteCustomer:        (d) => deleteCustomer(d),
    updateCustomerLoyalty: (d) => updateCustomerLoyalty(d),
    // Invoices
    getInvoices:           () => getInvoices(),
    addInvoice:            (d) => addInvoice(d),
    updateInvoice:         (d) => updateInvoice(d),
    deleteInvoice:         (d) => deleteInvoice(d),
    // Inventory (+ WantedQty)
    getInventory:          () => getInventory(),
    addInventoryItem:      (d) => addInventoryItem(d),
    updateInventoryItem:   (d) => updateInventoryItem(d),
    deleteInventoryItem:   (d) => deleteInventoryItem(d),
    updateStock:           (d) => updateStock(d),
    bulkUpdateInventory:   (d) => bulkUpdateInventory(d),
    setWantedQty:          (d) => setWantedQty(d),
    // Transactions (absorbs Expenses, Receipts, StockTxns)
    getTransactions:       () => getTransactions(),
    addTransaction:        (d) => addTransaction(d),
    updateTransaction:     (d) => updateTransaction(d),
    deleteTransaction:     (d) => deleteTransaction(d),
    // Expenses (delegated → Transactions)
    getExpenses:           () => getExpenses(),
    addExpense:            (d) => addExpense(d),
    updateExpense:         (d) => updateExpense(d),
    deleteExpense:         (d) => deleteExpense(d),
    // Bank Accounts
    getBankAccounts:       () => getBankAccounts(),
    addBankAccount:        (d) => addBankAccount(d),
    deleteBankAccount:     (d) => deleteBankAccount(d),
    // Payment Receipts (delegated → Transactions)
    getPaymentReceipts:    () => getPaymentReceipts(),
    addPaymentReceipt:     (d) => addPaymentReceipt(d),
    updatePaymentReceipt:  (d) => updatePaymentReceipt(d),
    deletePaymentReceipt:  (d) => deletePaymentReceipt(d),
    // Complaints
    getComplaints:         () => getComplaints(),
    addComplaint:          (d) => addComplaint(d),
    updateComplaint:       (d) => updateComplaint(d),
    updateComplaintStatus: (d) => updateComplaintStatus(d),
    deleteComplaint:       (d) => deleteComplaint(d),
    // Stock Wanting (delegated → Inventory.wantedQty)
    getStockWanting:       () => getStockWanting(),
    // Visitors
    getVisitors:           () => getVisitors(),
    addVisitor:            (d) => addVisitor(d),
    deleteVisitor:         (d) => deleteVisitor(d),
    // Service Reminders
    getReminders:          () => getReminders(),
    addReminder:           (d) => addReminder(d),
    updateReminder:        (d) => updateReminder(d),
    updateReminderStatus:  (d) => updateReminderStatus(d),
    deleteReminder:        (d) => deleteReminder(d),
    // Stock Transactions (delegated → Transactions)
    getStockTransactions:  () => getStockTransactions(),
    addStockTransaction:   (d) => addStockTransaction(d),
    // Salesmen
    getSalesmen:           () => getSalesmen(),
    addSalesman:           (d) => addSalesman(d),
    deleteSalesman:        (d) => deleteSalesman(d),
    // Users
    getUsers:              () => getUsers(),
    addUser:               (d) => addUser(d),
    updateUser:            (d) => updateUser(d),
    deleteUser:            (d) => deleteUser(d),
    toggleUserStatus:      (d) => toggleUserStatus(d),
    // Config
    getConfig:             (d) => getConfig(d),
    setConfig:             (d) => setConfig(d),
    // Recycle Bin
    getRecycleBin:         () => getRecycleBin(),
    addToRecycleBin:       (d) => addToRecycleBin(d),
    deleteFromRecycleBin:  (d) => deleteFromRecycleBin(d),
    emptyRecycleBin:       () => emptyRecycleBin(),
    // Dashboard
    getDashboardStats:     () => getDashboardStats(),
    // Pickup Requests
    getPickupRequests:     () => getPickupRequests(),
    addPickupRequest:      (d) => addPickupRequest(d),
    updatePickupRequest:   (d) => updatePickupRequest(d),
    deletePickupRequest:   (d) => deletePickupRequest(d),
    // Bulk Tools
    bulkImport:            (d) => bulkImport(d),
    // *** BATCH FETCH - single call for full sync ***
    getAllData:             () => getAllData(),
    // *** ONE-TIME DATA MIGRATION (run from GAS editor) ***
    migrateToMerged:       () => migrateToMerged(),
};
