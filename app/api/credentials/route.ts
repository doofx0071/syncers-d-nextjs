import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET_KEY = process.env.SECRET_KEY || 'default-secret-key-change-me';

// Helper to generate TURN credentials
function generateTurnCredentials(ttl: number) {
    const timestamp = Math.floor(Date.now() / 1000) + ttl;
    const username = `${timestamp}:${crypto.randomUUID().replace(/-/g, '')}`;
    const hmac = crypto.createHmac('sha1', SECRET_KEY);
    hmac.update(username);
    const password = hmac.digest('base64');
    return { username, password };
}

export async function GET() {
    try {
        const ttl = 300; // 5 minutes
        const { username, password } = generateTurnCredentials(ttl);

        // We are returning the token structure expected by the frontend
        // In the original python code, it generated a JWT token containing these credentials
        // But for simplicity and direct usage, we can return the TURN config directly or wrap it.
        // However, looking at the python code, it returns a JWT 'token'. 
        // Let's replicate the exact response format if the frontend expects it, 
        // OR simplify it given we are rewriting the frontend too.

        // Since we are rewriting the frontend, let's return the raw credentials 
        // directly so the frontend doesn't need to decode a JWT just to get them.

        return NextResponse.json({
            username,
            credential: password,
            ttl
        });
    } catch (error) {
        console.error('Error generating credentials:', error);
        return NextResponse.json(
            { error: 'Failed to generate credentials' },
            { status: 500 }
        );
    }
}
