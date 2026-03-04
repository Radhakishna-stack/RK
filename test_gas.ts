import fs from 'fs';

const ACTIONS = [
    'getCustomers', 'getInvoices', 'getInventory', 'getTransactions',
    'getExpenses', 'getBankAccounts', 'getPaymentReceipts', 'getComplaints',
    'getStockWanting', 'getVisitors', 'getReminders', 'getStockTransactions',
    'getSalesmen', 'getUsers', 'getRecycleBin', 'getDashboardStats',
    'getPickupRequests', 'getPickupSlots', 'getPickupBookings',
    'getFieldServiceJobs', 'getEmployeeLocations', 'getLocationUpdates',
    'getJobTimelineEvents', 'getAuditLogs'
];

async function testAllEndpoints(url: string) {
    if (!url) {
        console.error("Please provide the GAS URL.");
        process.exit(1);
    }

    console.log(`Starting validation for URL: ${url}\n`);

    let passed = 0;
    let failed = 0;

    for (const action of ACTIONS) {
        process.stdout.write(`Testing ${action}... `);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action, data: {} }),
            });
            const result = await res.json();

            if (result.success) {
                console.log(`✅ OK (${Array.isArray(result.data) ? result.data.length + ' rows' : 'Object'})`);
                passed++;
            } else {
                console.log(`❌ FAILED: ${result.error || 'Unknown error'}`);
                failed++;
            }
        } catch (e: any) {
            console.log(`❌ ERROR: ${e.message}`);
            failed++;
        }
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
}

const url = process.argv[2];
testAllEndpoints(url);
