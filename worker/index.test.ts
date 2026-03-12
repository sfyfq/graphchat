import { env } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from './index';

// Helper to compute SHA-256 in Node environment for test setup
async function nodeSha256(message: string): Promise<string> {
    const crypto = await import('node:crypto');
    return crypto.createHash('sha256').update(message).digest('hex');
}

describe('Worker Secure Proxy', () => {
    it('responds with 204 for OPTIONS preflight', async () => {
        const request = new Request('http://example.com', { method: 'OPTIONS' });
        const response = await worker.fetch(request, env as any);
        expect(response.status).toBe(204);
        expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('responds with 401 if Authorization header is missing', async () => {
        const request = new Request('http://example.com/v1/models', { method: 'GET' });
        const response = await worker.fetch(request, env as any);
        expect(response.status).toBe(401);
        expect(await response.text()).toContain('Unauthorized: Missing Token');
    });

    it('responds with 403 if email is not whitelisted', async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('tokeninfo')) {
                return Promise.resolve(new Response(JSON.stringify({ email: 'evil@example.com' }), { status: 200 }));
            }
            return Promise.resolve(new Response('Not found', { status: 404 }));
        });

        const request = new Request('http://example.com/v1/models', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer some-token' }
        });

        // Set up env whitelist (Legacy)
        const mockEnv = {
            ...env,
            GEMINI_API_KEY: 'test-key',
            ALLOWED_EMAILS: 'user@example.com,friend@example.com'
        };

        const response = await worker.fetch(request, mockEnv as any);
        expect(response.status).toBe(403);
        expect(await response.text()).toContain('Forbidden: Email evil@example.com not whitelisted');

        globalThis.fetch = originalFetch;
    });

    it('proxies to Gemini when authorized via Legacy Env', async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('tokeninfo')) {
                return Promise.resolve(new Response(JSON.stringify({ email: 'user@example.com' }), { status: 200 }));
            }
            if (url.includes('generativelanguage.googleapis.com')) {
                return Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            return Promise.resolve(new Response('Not found', { status: 404 }));
        });

        const request = new Request('http://example.com/v1/models', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer valid-token' }
        });

        const mockEnv = {
            ...env,
            GEMINI_API_KEY: 'test-key',
            ALLOWED_EMAILS: 'user@example.com'
        };

        const response = await worker.fetch(request, mockEnv as any);
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({ status: 'ok' });

        globalThis.fetch = originalFetch;
    });

    it('proxies to Gemini when authorized via Hashed KV', async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('tokeninfo')) {
                return Promise.resolve(new Response(JSON.stringify({ email: 'vip@example.com' }), { status: 200 }));
            }
            if (url.includes('generativelanguage.googleapis.com')) {
                return Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            return Promise.resolve(new Response('Not found', { status: 404 }));
        });

        // 1. Calculate hash
        const email = 'vip@example.com';
        const hash = await nodeSha256(email);

        // 2. Put into Mock KV
        const { WHITELIST_KV } = env as any;
        await WHITELIST_KV.put(hash, 'true');

        const request = new Request('http://example.com/v1/models', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer vip-token' }
        });

        const mockEnv = {
            ...env,
            GEMINI_API_KEY: 'test-key',
            ALLOWED_EMAILS: 'user@example.com', // vip@example.com is NOT here
            WHITELIST_KV
        };

        const response = await worker.fetch(request, mockEnv as any);
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({ status: 'ok' });

        globalThis.fetch = originalFetch;
    });

    it('responds with 413 if Content-Length exceeds 15MB', async () => {
        const bigSize = 16 * 1024 * 1024; // 16MB
        const request = new Request('http://example.com/v1/models', { 
            method: 'POST',
            headers: { 'Content-Length': bigSize.toString() }
        });
        const response = await worker.fetch(request, env as any);
        expect(response.status).toBe(413);
        expect(await response.text()).toBe('Payload Too Large');
    });
});
