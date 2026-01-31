// Demo Data Generator for Field Service Testing
import { fieldServiceManager } from './services/fieldServiceManager';
import { FieldJobStatus } from './types';

export function generateDemoFieldServiceJobs() {
    const demoJobs = [
        {
            customerId: 'cust_001',
            customerName: 'Rajesh Kumar',
            customerPhone: '+91 9876543210',
            bikeNumber: 'TN 01 AB 1234',
            issueDescription: 'Bike not starting, battery issue suspected',
            priority: 'High' as const,
            location: {
                lat: 13.0827,
                lng: 80.2707,
                address: '123, Anna Nagar, Chennai, Tamil Nadu'
            }
        },
        {
            customerId: 'cust_002',
            customerName: 'Priya Sharma',
            customerPhone: '+91 9123456789',
            bikeNumber: 'TN 09 XY 5678',
            issueDescription: 'Engine making unusual noise, needs inspection',
            priority: 'Urgent' as const,
            location: {
                lat: 13.0475,
                lng: 80.2206,
                address: '456, T Nagar, Chennai, Tamil Nadu'
            }
        },
        {
            customerId: 'cust_003',
            customerName: 'Amit Patel',
            customerPhone: '+91 9988776655',
            bikeNumber: 'TN 22 CD 9012',
            issueDescription: 'Regular servicing required, 5000 km service',
            priority: 'Medium' as const,
            location: {
                lat: 13.1062,
                lng: 80.2095,
                address: '789, Mylapore, Chennai, Tamil Nadu'
            }
        },
        {
            customerId: 'cust_004',
            customerName: 'Sneha Reddy',
            customerPhone: '+91 9444555666',
            bikeNumber: 'TN 03 EF 3456',
            issueDescription: 'Brake pads need replacement',
            priority: 'Low' as const,
            location: {
                lat: 13.0352,
                lng: 80.2572,
                address: '321, Adyar, Chennai, Tamil Nadu'
            }
        }
    ];

    console.log('Creating demo field service jobs...');

    demoJobs.forEach((jobData, index) => {
        const job = fieldServiceManager.createJob(jobData);
        console.log(`Created job ${index + 1}:`, job.id, '-', job.customerName);

        // Assign some jobs to employees for testing
        if (index === 0) {
            fieldServiceManager.assignJob(job.id, 'emp_001', 'Ravi Kumar');
        } else if (index === 1) {
            fieldServiceManager.assignJob(job.id, 'emp_002', 'Suresh Babu');
            // Simulate job in progress
            fieldServiceManager.updateJobStatus(job.id, FieldJobStatus.ACCEPTED, 'emp_002');
            fieldServiceManager.updateJobStatus(job.id, FieldJobStatus.EN_ROUTE, 'emp_002');
        }
    });

    console.log('Demo jobs created successfully!');
    console.log('Total active jobs:', fieldServiceManager.getAllActiveJobs().length);
}

// Generate demo employee locations
export function generateDemoEmployeeLocations() {
    const demoEmployees = [
        {
            employeeId: 'emp_001',
            employeeName: 'Ravi Kumar',
            lat: 13.0678,
            lng: 80.2377,
            accuracy: 25,
            currentJobId: fieldServiceManager.getAllActiveJobs()[0]?.id,
            battery: 85
        },
        {
            employeeId: 'emp_002',
            employeeName: 'Suresh Babu',
            lat: 13.0521,
            lng: 80.2284,
            accuracy: 18,
            currentJobId: fieldServiceManager.getAllActiveJobs()[1]?.id,
            battery: 62
        },
        {
            employeeId: 'emp_003',
            employeeName: 'Vijay Anand',
            lat: 13.0892,
            lng: 80.2654,
            accuracy: 30,
            battery: 91
        }
    ];

    console.log('Updating demo employee locations...');

    demoEmployees.forEach((emp, index) => {
        fieldServiceManager.updateEmployeeLocation(
            emp.employeeId,
            emp.employeeName,
            emp.lat,
            emp.lng,
            emp.accuracy,
            emp.currentJobId,
            emp.battery
        );
        console.log(`Updated location for ${emp.employeeName}`);
    });

    console.log('Demo employee locations set!');
}

// Initialize all demo data
export function initializeDemoData() {
    console.log('🚀 Initializing Field Service Demo Data...');
    generateDemoFieldServiceJobs();
    generateDemoEmployeeLocations();
    console.log('✅ Demo data initialization complete!');
    console.log('');
    console.log('📍 Navigate to:');
    console.log('   - Employee Panel > My GPS Jobs (for employee view)');
    console.log('   - More > Field Service Manager (for manager dashboard)');
}

// Auto-initialize on page load (only in development)
if (typeof window !== 'undefined') {
    // Wait for page load
    window.addEventListener('load', () => {
        // Only run once
        const hasInitialized = sessionStorage.getItem('demoDataInitialized');
        if (!hasInitialized) {
            setTimeout(() => {
                initializeDemoData();
                sessionStorage.setItem('demoDataInitialized', 'true');
            }, 1000); // Delay to ensure services are ready
        }
    });
}
