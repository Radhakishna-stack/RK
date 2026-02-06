// PWA Registration & Service Worker Setup
export class PWAManager {
    private static instance: PWAManager;
    private registration: ServiceWorkerRegistration | null = null;
    private deferredPrompt: any = null;

    private constructor() {
        this.init();
    }

    static getInstance(): PWAManager {
        if (!PWAManager.instance) {
            PWAManager.instance = new PWAManager();
        }
        return PWAManager.instance;
    }

    private async init() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', this.registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }

        // Capture install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('PWA install prompt captured');
        });
    }

    // Show install prompt
    async showInstallPrompt(): Promise<boolean> {
        if (!this.deferredPrompt) {
            console.log('No install prompt available');
            return false;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;

        return outcome === 'accepted';
    }

    // Check if app is installed
    isInstalled(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
    }

    // Request notification permission
    async requestNotificationPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        const permission = await Notification.requestPermission();
        return permission;
    }

    // Send push notification (for testing)
    async sendTestNotification(title: string, body: string) {
        if (!this.registration) {
            console.error('No service worker registration');
            return;
        }

        const permission = await this.requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return;
        }

        await this.registration.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            data: { url: '/' }
        } as any);
    }

    // Send job notification to employee
    async sendJobNotification(
        title: string,
        body: string,
        jobId: string,
        url: string = '/field-jobs'
    ): Promise<boolean> {
        if (!this.registration) {
            console.error('No service worker registration');
            return false;
        }

        const permission = await this.requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return false;
        }

        try {
            await this.registration.showNotification(title, {
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200, 100, 200], // Attention-grabbing pattern
                tag: `job-${jobId}`, // Prevent duplicate notifications
                requireInteraction: true, // Notification stays until user interacts
                data: {
                    url,
                    jobId,
                    timestamp: new Date().toISOString()
                },
                actions: [
                    {
                        action: 'view',
                        title: 'View Job'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss'
                    }
                ]
            } as any);

            console.log(`Notification sent for job ${jobId}`);
            return true;
        } catch (error) {
            console.error('Failed to send notification:', error);
            return false;
        }
    }

    // Background sync registration
    async registerBackgroundSync(tag: string) {
        if (!this.registration) {
            console.error('No service worker registration');
            return;
        }

        try {
            await (this.registration as any).sync.register(tag);
            console.log('Background sync registered:', tag);
        } catch (error) {
            console.error('Background sync registration failed:', error);
        }
    }
}

// Initialize PWA on app startup
export const pwaManager = PWAManager.getInstance();
