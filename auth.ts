import { AuthSession, User, UserRole } from './types';

const SESSION_KEY = 'mg_auth_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// ============================================
// Secure Password Hashing — PBKDF2 via Web Crypto API
// No external library needed; runs in all modern browsers.
// ============================================

/**
 * Hash a password using PBKDF2-SHA256 with a random salt.
 * Returns a portable string: "pbkdf2:<salt_hex>:<hash_hex>"
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
        key,
        256
    );
    const toHex = (buf: ArrayBuffer) =>
        Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:${toHex(salt.buffer)}:${toHex(bits)}`;
}

/**
 * Verify a password against a stored hash string.
 * Supports:
 *   1. PBKDF2 hashes (most secure, preferred for new accounts)
 *   2. Legacy btoa hashes (old frontend-created accounts)
 *   3. Plaintext passwords (accounts created directly in Google Sheets)
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    // PBKDF2 hash — most secure
    if (storedHash.startsWith('pbkdf2:')) {
        const [, saltHex, hashHex] = storedHash.split(':');
        const fromHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
        const salt = fromHex(saltHex);

        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
            key,
            256
        );
        const toHex = (buf: ArrayBuffer) =>
            Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

        // Constant-time comparison to prevent timing attacks
        const computed = toHex(bits);
        let mismatch = computed.length !== hashHex.length ? 1 : 0;
        for (let i = 0; i < Math.min(computed.length, hashHex.length); i++) {
            mismatch |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i);
        }
        return mismatch === 0;
    }

    // Legacy: btoa hash (old frontend-created accounts)
    if (btoa(password) === storedHash) {
        return true;
    }

    // Plaintext fallback: accounts added directly in Google Sheets
    // (no hashing applied in GAS backend)
    return password === storedHash;
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
 * Validate credentials and return user if valid.
 * Uses constant-time comparison for security.
 */
export async function validateCredentials(
    username: string,
    password: string,
    users: User[]
): Promise<User | null> {
    // Sanitize: trim and lowercase username input
    const sanitizedUsername = username.trim().toLowerCase();

    if (!sanitizedUsername || !password) return null;

    const user = users.find(u => u.username.toLowerCase() === sanitizedUsername);

    if (!user) {
        // Still run a hash derivation to prevent timing-based user enumeration
        await hashPassword(password);
        return null;
    }

    if (!user.isActive) {
        throw new Error('User account is disabled');
    }

    const valid = await verifyPassword(password, user.password);
    return valid ? user : null;
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
 * Hash password for storage (use when creating/updating users).
 */
export function encryptPassword(password: string): Promise<string> {
    return hashPassword(password);
}

