import crypto from 'crypto';

let jwtSecret: string | null = null;

export function generateSecret(): string {
    // Generate a secure random 256-bit (32-byte) secret and convert to base64
    const secret = crypto.randomBytes(32).toString('base64');
    jwtSecret = secret;
    return secret;
}

export function getSecret(): string {
    if (!jwtSecret) {
        throw new Error('JWT secret has not been generated');
    }
    return jwtSecret;
} 