import { env } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from './index';

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
    // We need to mock the external fetch (Google tokeninfo and Gemini)
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
    
    // Set up env whitelist
    const mockEnv = {
      GEMINI_API_KEY: 'test-key',
      ALLOWED_EMAILS: 'user@example.com,friend@example.com'
    };

    const response = await worker.fetch(request, mockEnv as any);
    expect(response.status).toBe(403);
    expect(await response.text()).toContain('Forbidden: Email evil@example.com not whitelisted');

    globalThis.fetch = originalFetch;
  });

  it('proxies to Gemini correctly when authorized', async () => {
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
      GEMINI_API_KEY: 'test-key',
      ALLOWED_EMAILS: 'user@example.com'
    };

    const response = await worker.fetch(request, mockEnv as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: 'ok' });

    globalThis.fetch = originalFetch;
  });
});
