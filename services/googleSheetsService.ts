/**
 * Google Sheets Service - Frontend Bridge
 * ========================================
 * Connects the React app to the Google Apps Script backend.
 * Mirrors the dbService API so pages don't need to change.
 * 
 * SETUP: Replace GAS_URL with your deployed Google Apps Script Web App URL.
 */

// ============================================
// CONFIGURATION
// ============================================

// Replace this with your deployed Google Apps Script Web App URL
const GAS_URL = localStorage.getItem('gas_url') || '';

// Cache TTL in milliseconds (5 minutes for read cache)
const CACHE_TTL = 5 * 60 * 1000;

// In-memory cache for read operations
const cache: Record<string, { data: any; timestamp: number }> = {};

// ============================================
// CORE HTTP LAYER
// ============================================

async function callGAS(action: string, data?: any): Promise<any> {
    const url = GAS_URL;
    if (!url) {
        console.warn('[GoogleSheets] No GAS_URL configured. Falling back to localStorage.');
        throw new Error('GAS_URL not configured');
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, // GAS requires text/plain for CORS
            body: JSON.stringify({ action, data: data || {} }),
            mode: 'no-cors' as RequestMode // GAS deployed web apps need this sometimes
        });

        // For 'no-cors' mode, response will be opaque
        // We use a different approach: redirect-based fetch
        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        return result.data;
    } catch (error) {
        console.error(`[GoogleSheets] ${action} failed:`, error);
        throw error;
    }
}

/**
 * Smart fetch: try Google Sheets first, fall back to localStorage cache
 */
async function fetchWithFallback(action: string, lsKey: string, data?: any): Promise<any> {
    try {
        const result = await callGAS(action, data);
        // Cache to localStorage as backup
        if (result !== undefined && result !== null) {
            localStorage.setItem(lsKey, JSON.stringify(result));
            cache[action] = { data: result, timestamp: Date.now() };
        }
        return result;
    } catch {
        // Fallback to localStorage
        const cached = localStorage.getItem(lsKey);
        return cached ? JSON.parse(cached) : [];
    }
}

/**
 * Smart write: write to Google Sheets, then update localStorage cache
 */
async function writeWithSync(action: string, lsKey: string, data: any, allAction: string): Promise<any> {
    try {
        const result = await callGAS(action, data);
        // Refresh the full list in localStorage cache
        try {
            const all = await callGAS(allAction);
            localStorage.setItem(lsKey, JSON.stringify(all));
        } catch { /* ignore cache refresh failure */ }
        return result;
    } catch {
        // If GAS fails, we still want the data saved somewhere
        console.warn(`[GoogleSheets] Write failed for ${action}, data may be lost`);
        throw new Error('Failed to save to Google Sheets');
    }
}

// ============================================
// SERVICE EXPORT
// ============================================

import {
    Customer, Visitor, Complaint, Invoice, InventoryItem, Expense,
    Transaction, BankAccount, PaymentReceipt, StockWantingItem,
    ServiceReminder, Salesman, StockTransaction, DashboardStats,
    AppSettings, User, RecycleBinItem, ComplaintStatus, RolePermissions
} from '../types';

const LS_KEYS = {
    CUSTOMERS: 'mg_customers',
    VISITORS: 'mg_visitors',
    STOCK_WANTING: 'mg_stock_wanting',
    COMPLAINTS: 'mg_complaints',
    INVOICES: 'mg_invoices',
    INVENTORY: 'mg_inventory',
    EXPENSES: 'mg_expenses',
    REMINDERS: 'mg_reminders',
    TRANSACTIONS: 'mg_transactions',
    BANK_ACCOUNTS: 'mg_bank_accounts',
    PAYMENT_RECEIPTS: 'mg_payment_receipts',
    SALESMEN: 'mg_salesmen',
    USERS: 'mg_users',
    STOCK_TXNS: 'mg_stock_txns',
    SETTINGS: 'mg_settings',
    RECYCLE_BIN: 'mg_recycle_bin',
};

export const sheetsService = {

    // ---- Configuration ----
    isConfigured(): boolean {
        return !!GAS_URL;
    },

    setGasUrl(url: string): void {
        localStorage.setItem('gas_url', url);
        window.location.reload(); // Reload to pick up new URL
    },

    getGasUrl(): string {
        return GAS_URL;
    },

    // ---- Customers ----
    async getCustomers(): Promise<Customer[]> {
        return fetchWithFallback('getCustomers', LS_KEYS.CUSTOMERS);
    },

    async addCustomer(data: Partial<Customer>): Promise<Customer> {
        return writeWithSync('addCustomer', LS_KEYS.CUSTOMERS, data, 'getCustomers');
    },

    async updateCustomer(data: Customer): Promise<void> {
        await writeWithSync('updateCustomer', LS_KEYS.CUSTOMERS, data, 'getCustomers');
    },

    async deleteCustomer(id: string): Promise<void> {
        await writeWithSync('deleteCustomer', LS_KEYS.CUSTOMERS, { id }, 'getCustomers');
    },

    async updateCustomerLoyalty(id: string, points: number): Promise<void> {
        await callGAS('updateCustomerLoyalty', { id, loyaltyPoints: points });
    },

    // ---- Invoices ----
    async getInvoices(): Promise<Invoice[]> {
        return fetchWithFallback('getInvoices', LS_KEYS.INVOICES);
    },

    async addInvoice(data: Partial<Invoice>): Promise<Invoice> {
        return writeWithSync('addInvoice', LS_KEYS.INVOICES, data, 'getInvoices');
    },

    async updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {
        await writeWithSync('updateInvoice', LS_KEYS.INVOICES, { ...data, id }, 'getInvoices');
    },

    async deleteInvoice(id: string): Promise<void> {
        await writeWithSync('deleteInvoice', LS_KEYS.INVOICES, { id }, 'getInvoices');
    },

    // ---- Inventory ----
    async getInventory(): Promise<InventoryItem[]> {
        return fetchWithFallback('getInventory', LS_KEYS.INVENTORY);
    },

    async addInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
        return writeWithSync('addInventoryItem', LS_KEYS.INVENTORY, data, 'getInventory');
    },

    async updateInventory(id: string, updates: Partial<InventoryItem>): Promise<void> {
        await writeWithSync('updateInventoryItem', LS_KEYS.INVENTORY, { ...updates, id }, 'getInventory');
    },

    async deleteInventoryItem(id: string): Promise<void> {
        await writeWithSync('deleteInventoryItem', LS_KEYS.INVENTORY, { id }, 'getInventory');
    },

    async updateStock(id: string, delta: number, note: string): Promise<void> {
        await callGAS('updateStock', { id, delta });
        // Also record the stock transaction
        await callGAS('addStockTransaction', { itemId: id, type: delta > 0 ? 'IN' : 'OUT', quantity: Math.abs(delta), note });
    },

    async bulkUpdateInventory(updates: any[]): Promise<{ updated: number; created: number }> {
        return callGAS('bulkUpdateInventory', { items: updates });
    },

    // ---- Transactions ----
    async getTransactions(): Promise<Transaction[]> {
        return fetchWithFallback('getTransactions', LS_KEYS.TRANSACTIONS);
    },

    async addTransaction(data: Partial<Transaction>): Promise<Transaction> {
        return writeWithSync('addTransaction', LS_KEYS.TRANSACTIONS, data, 'getTransactions');
    },

    async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
        await writeWithSync('updateTransaction', LS_KEYS.TRANSACTIONS, { ...updates, id }, 'getTransactions');
    },

    async deleteTransaction(id: string): Promise<void> {
        await writeWithSync('deleteTransaction', LS_KEYS.TRANSACTIONS, { id }, 'getTransactions');
    },

    // ---- Expenses ----
    async getExpenses(): Promise<Expense[]> {
        return fetchWithFallback('getExpenses', LS_KEYS.EXPENSES);
    },

    async addExpense(data: Partial<Expense>): Promise<Expense> {
        return writeWithSync('addExpense', LS_KEYS.EXPENSES, data, 'getExpenses');
    },

    async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
        await writeWithSync('updateExpense', LS_KEYS.EXPENSES, { ...updates, id }, 'getExpenses');
    },

    async deleteExpense(id: string): Promise<void> {
        await writeWithSync('deleteExpense', LS_KEYS.EXPENSES, { id }, 'getExpenses');
    },

    // ---- Bank Accounts ----
    async getBankAccounts(): Promise<BankAccount[]> {
        return fetchWithFallback('getBankAccounts', LS_KEYS.BANK_ACCOUNTS);
    },

    async addBankAccount(data: Partial<BankAccount>): Promise<BankAccount> {
        return writeWithSync('addBankAccount', LS_KEYS.BANK_ACCOUNTS, data, 'getBankAccounts');
    },

    async deleteBankAccount(id: string): Promise<void> {
        await writeWithSync('deleteBankAccount', LS_KEYS.BANK_ACCOUNTS, { id }, 'getBankAccounts');
    },

    // ---- Payment Receipts ----
    async getPaymentReceipts(): Promise<PaymentReceipt[]> {
        return fetchWithFallback('getPaymentReceipts', LS_KEYS.PAYMENT_RECEIPTS);
    },

    async addPaymentReceipt(data: Partial<PaymentReceipt>): Promise<PaymentReceipt> {
        return writeWithSync('addPaymentReceipt', LS_KEYS.PAYMENT_RECEIPTS, data, 'getPaymentReceipts');
    },

    async updatePaymentReceipt(id: string, updates: Partial<PaymentReceipt>): Promise<void> {
        await writeWithSync('updatePaymentReceipt', LS_KEYS.PAYMENT_RECEIPTS, { ...updates, id }, 'getPaymentReceipts');
    },

    async deletePaymentReceipt(id: string): Promise<void> {
        await writeWithSync('deletePaymentReceipt', LS_KEYS.PAYMENT_RECEIPTS, { id }, 'getPaymentReceipts');
    },

    // ---- Complaints ----
    async getComplaints(): Promise<Complaint[]> {
        return fetchWithFallback('getComplaints', LS_KEYS.COMPLAINTS);
    },

    async addComplaint(data: Partial<Complaint>): Promise<Complaint> {
        return writeWithSync('addComplaint', LS_KEYS.COMPLAINTS, data, 'getComplaints');
    },

    async updateComplaint(id: string, data: Partial<Complaint>): Promise<void> {
        await writeWithSync('updateComplaint', LS_KEYS.COMPLAINTS, { ...data, id }, 'getComplaints');
    },

    async updateComplaintStatus(id: string, status: ComplaintStatus): Promise<void> {
        await callGAS('updateComplaintStatus', { id, status });
    },

    async deleteComplaint(id: string): Promise<void> {
        await writeWithSync('deleteComplaint', LS_KEYS.COMPLAINTS, { id }, 'getComplaints');
    },

    // ---- Stock Wanting ----
    async getStockWanting(): Promise<StockWantingItem[]> {
        return fetchWithFallback('getStockWanting', LS_KEYS.STOCK_WANTING);
    },

    async addStockWantingItem(data: Partial<StockWantingItem>): Promise<StockWantingItem> {
        return writeWithSync('addStockWanting', LS_KEYS.STOCK_WANTING, data, 'getStockWanting');
    },

    async deleteStockWantingItem(id: string): Promise<void> {
        await writeWithSync('deleteStockWanting', LS_KEYS.STOCK_WANTING, { id }, 'getStockWanting');
    },

    // ---- Visitors ----
    async getVisitors(): Promise<Visitor[]> {
        return fetchWithFallback('getVisitors', LS_KEYS.VISITORS);
    },

    async addVisitor(data: Partial<Visitor>): Promise<Visitor> {
        return writeWithSync('addVisitor', LS_KEYS.VISITORS, data, 'getVisitors');
    },

    async deleteVisitor(id: string): Promise<void> {
        await writeWithSync('deleteVisitor', LS_KEYS.VISITORS, { id }, 'getVisitors');
    },

    // ---- Service Reminders ----
    async getReminders(): Promise<ServiceReminder[]> {
        return fetchWithFallback('getReminders', LS_KEYS.REMINDERS);
    },

    async addReminder(data: Partial<ServiceReminder>): Promise<ServiceReminder> {
        return writeWithSync('addReminder', LS_KEYS.REMINDERS, data, 'getReminders');
    },

    async updateReminder(id: string, updates: Partial<ServiceReminder>): Promise<void> {
        await writeWithSync('updateReminder', LS_KEYS.REMINDERS, { ...updates, id }, 'getReminders');
    },

    async updateReminderStatus(id: string, status: 'Pending' | 'Sent'): Promise<void> {
        await callGAS('updateReminderStatus', { id, status });
    },

    async deleteReminder(id: string): Promise<void> {
        await writeWithSync('deleteReminder', LS_KEYS.REMINDERS, { id }, 'getReminders');
    },

    // ---- Stock Transactions ----
    async getStockTransactions(itemId: string): Promise<StockTransaction[]> {
        const all: StockTransaction[] = await fetchWithFallback('getStockTransactions', LS_KEYS.STOCK_TXNS);
        return all.filter(st => st.itemId === itemId);
    },

    // ---- Salesmen ----
    async getSalesmen(): Promise<Salesman[]> {
        return fetchWithFallback('getSalesmen', LS_KEYS.SALESMEN);
    },

    async addSalesman(data: Partial<Salesman>): Promise<Salesman> {
        return writeWithSync('addSalesman', LS_KEYS.SALESMEN, data, 'getSalesmen');
    },

    async deleteSalesman(id: string): Promise<void> {
        await writeWithSync('deleteSalesman', LS_KEYS.SALESMEN, { id }, 'getSalesmen');
    },

    // ---- Users ----
    async getUsers(): Promise<User[]> {
        return fetchWithFallback('getUsers', LS_KEYS.USERS);
    },

    async addUser(data: Partial<User>): Promise<User> {
        return writeWithSync('addUser', LS_KEYS.USERS, data, 'getUsers');
    },

    async updateUser(id: string, updates: Partial<User>): Promise<void> {
        await writeWithSync('updateUser', LS_KEYS.USERS, { ...updates, id }, 'getUsers');
    },

    async deleteUser(id: string): Promise<void> {
        await writeWithSync('deleteUser', LS_KEYS.USERS, { id }, 'getUsers');
    },

    async toggleUserStatus(id: string): Promise<void> {
        await callGAS('toggleUserStatus', { id });
    },

    async getUserByUsername(username: string): Promise<User | null> {
        const users = await this.getUsers();
        return users.find(u => u.username === username) || null;
    },

    // ---- Settings & Config ----
    async getSettings(): Promise<AppSettings> {
        try {
            const result = await callGAS('getConfig', { key: 'app_settings' });
            if (result) return result;
        } catch { /* fallback */ }
        const cached = localStorage.getItem(LS_KEYS.SETTINGS);
        return cached ? JSON.parse(cached) : null;
    },

    async updateSettings(settings: AppSettings): Promise<void> {
        localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(settings));
        try {
            await callGAS('setConfig', { key: 'app_settings', value: settings });
        } catch { /* silent fail on config sync */ }
    },

    async getRolePermissions(): Promise<Record<string, RolePermissions>> {
        try {
            const result = await callGAS('getConfig', { key: 'role_permissions' });
            if (result) return result;
        } catch { /* fallback */ }
        return {};
    },

    async updateRolePermissions(role: string, permissions: RolePermissions): Promise<void> {
        const all = await this.getRolePermissions();
        all[role] = permissions;
        await callGAS('setConfig', { key: 'role_permissions', value: all });
    },

    // ---- Recycle Bin ----
    async getRecycleBin(): Promise<RecycleBinItem[]> {
        return fetchWithFallback('getRecycleBin', LS_KEYS.RECYCLE_BIN);
    },

    async moveToRecycleBin(type: string, data: any): Promise<void> {
        await callGAS('addToRecycleBin', { originalId: data.id, type, data });
    },

    async restoreFromBin(binId: string): Promise<void> {
        // Get the item data, then restore to original sheet
        const bin = await this.getRecycleBin();
        const item = bin.find(b => b.binId === binId);
        if (!item) return;

        // Re-add to the appropriate entity
        const restoreActions: Record<string, string> = {
            'Customer': 'addCustomer',
            'Invoice': 'addInvoice',
            'Complaint': 'addComplaint',
            'Inventory': 'addInventoryItem',
            'Expense': 'addExpense',
            'Visitor': 'addVisitor',
        };

        const action = restoreActions[item.type];
        if (action) {
            await callGAS(action, item.data);
        }
        await callGAS('deleteFromRecycleBin', { binId });
    },

    async emptyRecycleBin(): Promise<void> {
        await callGAS('emptyRecycleBin');
    },

    // ---- Dashboard ----
    async getDashboardStats(): Promise<DashboardStats> {
        return fetchWithFallback('getDashboardStats', 'mg_dashboard_cache');
    },

    // ---- Account Balance (computed) ----
    async getAccountBalance(accountId: string): Promise<number> {
        const [accounts, transactions] = await Promise.all([
            this.getBankAccounts(),
            this.getTransactions()
        ]);

        const account = accounts.find(a => a.id === accountId);
        let balance = account?.openingBalance || 0;

        for (const txn of transactions) {
            if (txn.accountId === accountId) {
                if (txn.type === 'IN' || txn.type === 'cash-in') balance += txn.amount;
                else if (txn.type === 'OUT' || txn.type === 'cash-out' || txn.type === 'expense' || txn.type === 'purchase') balance -= txn.amount;
            }
        }

        return balance;
    },

    // ---- Data Migration ----
    async migrateLocalStorageToSheets(): Promise<{ success: boolean; summary: string }> {
        const entities = [
            { lsKey: 'mg_customers', sheet: 'Customers', fields: ['id', 'name', 'phone', 'bikeNumber', 'city', 'email', 'address', 'gstin', 'loyaltyPoints', 'createdAt'] },
            { lsKey: 'mg_invoices', sheet: 'Invoices', fields: ['id', 'complaintId', 'bikeNumber', 'customerName', 'customerPhone', 'details', 'items', 'estimatedCost', 'finalAmount', 'taxAmount', 'subTotal', 'paymentStatus', 'accountId', 'paymentMode', 'date', 'odometerReading', 'docType', 'serviceReminderDate'] },
            { lsKey: 'mg_inventory', sheet: 'Inventory', fields: ['id', 'name', 'category', 'stock', 'unitPrice', 'purchasePrice', 'itemCode', 'gstRate', 'hsn', 'lastUpdated'] },
            { lsKey: 'mg_transactions', sheet: 'Transactions', fields: ['id', 'entityId', 'accountId', 'type', 'amount', 'paymentMode', 'date', 'description', 'category', 'status', 'chequeNumber', 'partyName', 'bankName', 'items'] },
            { lsKey: 'mg_expenses', sheet: 'Expenses', fields: ['id', 'description', 'amount', 'category', 'date', 'paymentMode', 'transactionId', 'accountId'] },
            { lsKey: 'mg_bank_accounts', sheet: 'BankAccounts', fields: ['id', 'name', 'bankName', 'accountNumber', 'type', 'openingBalance', 'createdAt'] },
            { lsKey: 'mg_payment_receipts', sheet: 'PaymentReceipts', fields: ['id', 'receiptNumber', 'customerId', 'customerName', 'customerPhone', 'bikeNumber', 'cashAmount', 'upiAmount', 'totalAmount', 'date', 'description', 'createdAt'] },
            { lsKey: 'mg_complaints', sheet: 'Complaints', fields: ['id', 'bikeNumber', 'customerName', 'customerPhone', 'details', 'photoUrls', 'estimatedCost', 'status', 'createdAt', 'dueDate', 'odometerReading'] },
            { lsKey: 'mg_stock_wanting', sheet: 'StockWanting', fields: ['id', 'partNumber', 'itemName', 'quantity', 'rate', 'createdAt'] },
            { lsKey: 'mg_visitors', sheet: 'Visitors', fields: ['id', 'name', 'bikeNumber', 'phone', 'remarks', 'type', 'photoUrls', 'createdAt'] },
            { lsKey: 'mg_reminders', sheet: 'ServiceReminders', fields: ['id', 'bikeNumber', 'customerName', 'phone', 'reminderDate', 'serviceType', 'status', 'lastNotified', 'message', 'serviceDate'] },
            { lsKey: 'mg_users', sheet: 'Users', fields: ['id', 'username', 'password', 'role', 'name', 'phone', 'createdAt', 'isActive'] },
        ];

        let totalMigrated = 0;
        const results: string[] = [];

        for (const entity of entities) {
            const raw = localStorage.getItem(entity.lsKey);
            if (!raw) continue;

            try {
                const items = JSON.parse(raw);
                if (!Array.isArray(items) || items.length === 0) continue;

                // Convert each item to a row array
                const rows = items.map((item: any) => {
                    return entity.fields.map(field => {
                        let val = item[field];
                        if (Array.isArray(val)) val = field === 'items' ? JSON.stringify(val) : val.join(',');
                        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                        return val ?? '';
                    });
                });

                await callGAS('bulkImport', { sheetName: entity.sheet, rows });
                totalMigrated += items.length;
                results.push(`${entity.sheet}: ${items.length} rows`);
            } catch (err) {
                results.push(`${entity.sheet}: FAILED`);
            }
        }

        // Migrate settings
        const settings = localStorage.getItem('mg_settings');
        if (settings) {
            try {
                await callGAS('setConfig', { key: 'app_settings', value: settings });
                results.push('Settings: migrated');
            } catch { results.push('Settings: FAILED'); }
        }

        return {
            success: true,
            summary: `Migrated ${totalMigrated} records:\n${results.join('\n')}`
        };
    }
};
