// Field Service Manager - Job Assignment & Employee Tracking
import { FieldServiceJob, EmployeeLocation, FieldJobStatus, EmployeeStatus, Salesman } from '../types';
import { pwaManager } from './pwaManager';

// In-memory storage (will be replaced with Firebase/Supabase later)
class FieldServiceStore {
    private jobs: Map<string, FieldServiceJob> = new Map();
    private employeeLocations: Map<string, EmployeeLocation> = new Map();
    private jobTimeline: Map<string, Array<{ status: FieldJobStatus; timestamp: string; note?: string }>> = new Map();
    private listeners: Set<() => void> = new Set();

    // Jobs
    addJob(job: FieldServiceJob) {
        this.jobs.set(job.id, job);
        this.jobTimeline.set(job.id, [{
            status: job.status,
            timestamp: job.createdAt,
            note: 'Job created'
        }]);
        this.notifyListeners();
    }

    updateJob(jobId: string, updates: Partial<FieldServiceJob>) {
        const job = this.jobs.get(jobId);
        if (job) {
            const updatedJob = { ...job, ...updates };
            this.jobs.set(jobId, updatedJob);

            // Add to timeline if status changed
            if (updates.status && updates.status !== job.status) {
                const timeline = this.jobTimeline.get(jobId) || [];
                timeline.push({
                    status: updates.status,
                    timestamp: new Date().toISOString(),
                    note: updates.notes
                });
                this.jobTimeline.set(jobId, timeline);
            }

            this.notifyListeners();
        }
    }

    getJob(jobId: string): FieldServiceJob | undefined {
        return this.jobs.get(jobId);
    }

    getAllJobs(): FieldServiceJob[] {
        return Array.from(this.jobs.values());
    }

    getJobsByEmployee(employeeId: string): FieldServiceJob[] {
        return Array.from(this.jobs.values()).filter(job => job.assignedTo === employeeId);
    }

    getActiveJobs(): FieldServiceJob[] {
        return Array.from(this.jobs.values()).filter(job =>
            job.status !== FieldJobStatus.COMPLETED && job.status !== FieldJobStatus.CANCELLED
        );
    }

    // Employee Locations
    updateEmployeeLocation(location: EmployeeLocation) {
        this.employeeLocations.set(location.employeeId, location);
        this.notifyListeners();
    }

    getEmployeeLocation(employeeId: string): EmployeeLocation | undefined {
        return this.employeeLocations.get(employeeId);
    }

    getAllEmployeeLocations(): EmployeeLocation[] {
        return Array.from(this.employeeLocations.values());
    }

    // Timeline
    getJobTimeline(jobId: string) {
        return this.jobTimeline.get(jobId) || [];
    }

    // Listeners
    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener());
    }

    // Clear all data
    clear() {
        this.jobs.clear();
        this.employeeLocations.clear();
        this.jobTimeline.clear();
        this.notifyListeners();
    }
}

// Singleton store
const store = new FieldServiceStore();

// Field Service Manager API
export class FieldServiceManager {
    private static instance: FieldServiceManager;

    private constructor() { }

    static getInstance(): FieldServiceManager {
        if (!FieldServiceManager.instance) {
            FieldServiceManager.instance = new FieldServiceManager();
        }
        return FieldServiceManager.instance;
    }

    // Create new field service job
    createJob(jobData: Omit<FieldServiceJob, 'id' | 'createdAt' | 'status'>): FieldServiceJob {
        const job: FieldServiceJob = {
            ...jobData,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            status: FieldJobStatus.ASSIGNED
        };

        store.addJob(job);
        console.log('Field service job created:', job.id);

        return job;
    }

    // Assign job to employee
    assignJob(jobId: string, employeeId: string, employeeName: string): boolean {
        const job = store.getJob(jobId);
        if (!job) {
            console.error('Job not found:', jobId);
            return false;
        }

        store.updateJob(jobId, {
            assignedTo: employeeId,
            assignedToName: employeeName,
            status: FieldJobStatus.ASSIGNED
        });

        // Send push notification to employee
        pwaManager.sendJobNotification(
            '🔧 New Job Assigned',
            `${job.customerName} - ${job.bikeNumber}\n${job.issueDescription}`,
            jobId,
            `/field-jobs`
        ).catch(error => {
            console.error('Failed to send job notification:', error);
        });

        console.log(`Job ${jobId} assigned to ${employeeName}`);

        return true;
    }

    // Update job status
    updateJobStatus(
        jobId: string,
        status: FieldJobStatus,
        employeeId?: string,
        notes?: string
    ): boolean {
        const job = store.getJob(jobId);
        if (!job) {
            console.error('Job not found:', jobId);
            return false;
        }

        // Validate employee
        if (employeeId && job.assignedTo !== employeeId) {
            console.error('Employee not assigned to this job');
            return false;
        }

        const updates: Partial<FieldServiceJob> = { status, notes };

        // Update timestamps based on status
        switch (status) {
            case FieldJobStatus.ACCEPTED:
                updates.acceptedAt = new Date().toISOString();
                break;
            case FieldJobStatus.EN_ROUTE:
                updates.startedAt = new Date().toISOString();
                break;
            case FieldJobStatus.ARRIVED:
                updates.arrivedAt = new Date().toISOString();
                break;
            case FieldJobStatus.COMPLETED:
                updates.completedAt = new Date().toISOString();
                break;
        }

        store.updateJob(jobId, updates);
        console.log(`Job ${jobId} status updated to ${status}`);

        return true;
    }

    // Update employee location
    updateEmployeeLocation(
        employeeId: string,
        employeeName: string,
        lat: number,
        lng: number,
        accuracy: number,
        currentJobId?: string,
        battery?: number
    ) {
        // Determine employee status based on active job
        let status = EmployeeStatus.AVAILABLE;
        if (currentJobId) {
            const job = store.getJob(currentJobId);
            if (job && job.status !== FieldJobStatus.COMPLETED) {
                status = EmployeeStatus.ON_JOB;
            }
        }

        const location: EmployeeLocation = {
            employeeId,
            employeeName,
            status,
            currentJobId,
            location: { lat, lng, accuracy },
            lastUpdated: new Date().toISOString(),
            battery
        };

        store.updateEmployeeLocation(location);
    }

    // Get jobs for employee
    getEmployeeJobs(employeeId: string, activeOnly: boolean = false): FieldServiceJob[] {
        const allJobs = store.getJobsByEmployee(employeeId);

        if (activeOnly) {
            return allJobs.filter(job =>
                job.status !== FieldJobStatus.COMPLETED &&
                job.status !== FieldJobStatus.CANCELLED
            );
        }

        return allJobs;
    }

    // Get all active jobs
    getAllActiveJobs(): FieldServiceJob[] {
        return store.getActiveJobs();
    }

    // Get all jobs
    getAllJobs(): FieldServiceJob[] {
        return store.getAllJobs();
    }

    // Get job details
    getJob(jobId: string): FieldServiceJob | undefined {
        return store.getJob(jobId);
    }

    // Get employee location
    getEmployeeLocation(employeeId: string): EmployeeLocation | undefined {
        return store.getEmployeeLocation(employeeId);
    }

    // Get all employee locations
    getAllEmployeeLocations(): EmployeeLocation[] {
        return store.getAllEmployeeLocations();
    }

    // Get job timeline
    getJobTimeline(jobId: string) {
        return store.getJobTimeline(jobId);
    }

    // Find nearest available employee
    findNearestEmployee(
        customerLat: number,
        customerLng: number,
        employees: Salesman[]
    ): { employee: Salesman; distance: number } | null {
        let nearest: { employee: Salesman; distance: number } | null = null;
        let minDistance = Infinity;

        employees.forEach(employee => {
            const location = store.getEmployeeLocation(employee.id);
            if (location && location.status === EmployeeStatus.AVAILABLE) {
                const distance = this.calculateDistance(
                    customerLat,
                    customerLng,
                    location.location.lat,
                    location.location.lng
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = { employee, distance };
                }
            }
        });

        return nearest;
    }

    // Calculate distance between two points
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Subscribe to changes
    subscribe(listener: () => void) {
        return store.subscribe(listener);
    }

    // Generate unique ID
    private generateId(): string {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton instance
export const fieldServiceManager = FieldServiceManager.getInstance();
