// Geolocation Service - GPS Tracking Manager
import { LocationUpdate } from '../types';

export interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

export interface GeolocationError {
    code: number;
    message: string;
}

export class LocationService {
    private static instance: LocationService;
    private watchId: number | null = null;
    private isTracking: boolean = false;
    private lastPosition: GeolocationPosition | null = null;
    private updateInterval: number = 15000; // 15 seconds
    private onLocationUpdate: ((lat: number, lng: number, accuracy: number) => void) | null = null;
    private onError: ((error: GeolocationError) => void) | null = null;

    private constructor() { }

    static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    // Check if geolocation is supported
    isSupported(): boolean {
        return 'geolocation' in navigator;
    }

    // Request location permission
    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) {
            console.error('Geolocation not supported');
            return false;
        }

        try {
            const position = await this.getCurrentPosition();
            this.lastPosition = position;
            return true;
        } catch (error) {
            console.error('Location permission denied:', error);
            return false;
        }
    }

    // Get current position (one-time)
    getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            if (!this.isSupported()) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                (error) => reject(this.mapError(error)),
                {
                    enableHighAccuracy: options?.enableHighAccuracy ?? true,
                    timeout: options?.timeout ?? 10000,
                    maximumAge: options?.maximumAge ?? 0
                }
            );
        });
    }

    // Start continuous tracking
    startTracking(
        onUpdate: (lat: number, lng: number, accuracy: number) => void,
        onError?: (error: GeolocationError) => void
    ): boolean {
        if (!this.isSupported()) {
            console.error('Geolocation not supported');
            return false;
        }

        if (this.isTracking) {
            console.log('Already tracking');
            return true;
        }

        this.onLocationUpdate = onUpdate;
        this.onError = onError || null;

        // Use watchPosition for continuous tracking
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.lastPosition = position;
                const { latitude, longitude, accuracy } = position.coords;

                console.log(`Location update: ${latitude}, ${longitude} (±${accuracy}m)`);

                if (this.onLocationUpdate) {
                    this.onLocationUpdate(latitude, longitude, accuracy);
                }
            },
            (error) => {
                const mappedError = this.mapError(error);
                console.error('Location error:', mappedError);

                if (this.onError) {
                    this.onError(mappedError);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        this.isTracking = true;
        console.log('GPS tracking started');
        return true;
    }

    // Stop tracking
    stopTracking(): void {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        this.isTracking = false;
        this.onLocationUpdate = null;
        this.onError = null;
        console.log('GPS tracking stopped');
    }

    // Get last known position
    getLastPosition(): GeolocationPosition | null {
        return this.lastPosition;
    }

    // Check if currently tracking
    getIsTracking(): boolean {
        return this.isTracking;
    }

    // Calculate distance between two points (Haversine formula)
    calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    // Map GeolocationPositionError to custom error
    private mapError(error: GeolocationPositionError): GeolocationError {
        const messages: { [key: number]: string } = {
            1: 'Location permission denied',
            2: 'Location unavailable',
            3: 'Location request timeout'
        };

        return {
            code: error.code,
            message: messages[error.code] || 'Unknown location error'
        };
    }

    // Get battery level (if available)
    async getBatteryLevel(): Promise<number | null> {
        try {
            const battery = await (navigator as any).getBattery();
            return Math.round(battery.level * 100);
        } catch (error) {
            return null;
        }
    }
}

// Singleton instance
export const locationService = LocationService.getInstance();
