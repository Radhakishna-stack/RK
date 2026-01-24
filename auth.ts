import { AuthSession, User, UserRole } from './types';

const SESSION_KEY = 'mg_auth_session';

/**
 * Simple password hashing (for demo - use bcrypt in production)
 */
function hashPassword(password: string): string {
    // In production, use a proper hashing library like bcrypt
    // This is a simple base64 encoding for demonstration
    return btoa(password);
}

/**
 * Verify password against hash
 */
function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

/**
 * Save session to localStorage
 */
export function saveSession(session: AuthSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Get current session from localStorage
 */
export function getSession(): AuthSession | null {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    try {
        return JSON.parse(sessionData) as AuthSession;
    } catch (error) {
        console.error('Failed to parse session:', error);
        return null;
    }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return getSession() !== null;
}

/**
 * Get current user from session
 */
export function getCurrentUser(): Omit<User, 'password'> | null {
    const session = getSession();
    return session?.user || null;
}

/**
 * Get current user role
 */
export function getCurrentUserRole(): UserRole | null {
    const user = getCurrentUser();
    return user?.role || null;
}

/**
 * Create authentication session
 */
export function createSession(user: User): AuthSession {
    const { password, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        loginTime: new Date().toISOString(),
    };
}

/**
 * Validate credentials and return user if valid
 */
export async function validateCredentials(
    username: string,
    password: string,
    users: User[]
): Promise<User | null> {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
        return null;
    }

    if (!user.isActive) {
        throw new Error('User account is disabled');
    }

    // Verify password
    if (verifyPassword(password, user.password)) {
        return user;
    }

    return null;
}

/**
 * Login user
 */
export function login(user: User): AuthSession {
    const session = createSession(user);
    saveSession(session);
    return session;
}

/**
 * Logout user
 */
export function logout(): void {
    clearSession();
}

/**
 * Hash password for storage
 */
export function encryptPassword(password: string): string {
    return hashPassword(password);
}
