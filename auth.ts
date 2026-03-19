import { AuthSession, User, UserRole } from './types';

const SESSION_KEY = 'mg_auth_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours


/**
 * Verify a password — plain text comparison only.
 * Passwords are stored as-is in Google Sheets for easy management.
 */
function verifyPassword(password: string, storedPassword: string): boolean {
    return password === storedPassword;
}

/**
 * Save session to localStorage with expiry timestamp.
 */
export function saveSession(session: AuthSession): void {
    const withExpiry = { ...session, expiresAt: Date.now() + SESSION_TTL_MS };
    localStorage.setItem(SESSION_KEY, JSON.stringify(withExpiry));
}

/**
 * Get current session from localStorage. Returns null if expired.
 */
export function getSession(): AuthSession | null {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    try {
        const session = JSON.parse(sessionData);
        // Enforce session expiry
        if (session.expiresAt && Date.now() > session.expiresAt) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session as AuthSession;
    } catch {
        return null;
    }
}

/**
 * Clear session from localStorage.
 */
export function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
    return getSession() !== null;
}

/**
 * Get current user from session.
 */
export function getCurrentUser(): Omit<User, 'password'> | null {
    const session = getSession();
    return session?.user || null;
}

/**
 * Get current user role.
 */
export function getCurrentUserRole(): UserRole | null {
    const user = getCurrentUser();
    return user?.role || null;
}

/**
 * Create authentication session (strips password from stored user).
 */
export function createSession(user: User): AuthSession {
    const { password, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        loginTime: new Date().toISOString(),
    };
}

/**
 * Validate credentials — plain text comparison.
 */
export function validateCredentials(
    username: string,
    password: string,
    users: User[]
): User | null {
    const sanitizedUsername = username.trim().toLowerCase();
    if (!sanitizedUsername || !password) return null;

    const user = users.find(u => u.username.toLowerCase() === sanitizedUsername);
    if (!user) return null;

    // Be lenient with Google Sheets data: assume active unless explicitly set to false or 'FALSE'
    const isExplicitlyDisabled = user.isActive === false || String(user.isActive).toUpperCase() === 'FALSE';
    if (isExplicitlyDisabled) {
        throw new Error('User account is disabled');
    }

    return verifyPassword(password, user.password) ? user : null;
}

/**
 * Login user — creates and stores session.
 */
export function login(user: User): AuthSession {
    const session = createSession(user);
    saveSession(session);
    return session;
}

/**
 * Logout user.
 */
export function logout(): void {
    clearSession();
}

/**
 * Return password as-is — no hashing.
 * Kept for backward compatibility where encryptPassword was called.
 */
export function encryptPassword(password: string): Promise<string> {
    return Promise.resolve(password);
}

