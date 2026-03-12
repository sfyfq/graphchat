/**
 * Cloudflare Worker for GraphChat Secure Proxy
 * 
 * Acts as a transparent proxy for Gemini API, injecting Auth and API Key.
 * It is NOT smart about the model, path, or content.
 */

export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_EMAILS: string;
  WHITELIST_KV: KVNamespace;
}

const MAX_PAYLOAD_SIZE = 15 * 1024 * 1024; // 15MB

interface GoogleTokenPayload {
  email: string;
  [key: string]: any;
}

/**
 * Verify the Google ID Token using Google's tokeninfo endpoint.
 */
async function verifyToken(idToken: string): Promise<GoogleTokenPayload | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!res.ok) return null;
    return await res.json() as GoogleTokenPayload;
  } catch (e) {
    return null;
  }
}

/**
 * Computes SHA-256 hash of a string.
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks if the email is allowed via KV (hashed) or legacy Env (raw).
 */
async function isAllowed(email: string, env: Env): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  
  // 1. Check KV (Hashed)
  try {
    const hash = await sha256(normalized);
    const kvMatch = await env.WHITELIST_KV.get(hash);
    if (kvMatch) return true;
  } catch (e) {
    console.error("KV Lookup error", e);
  }

  // 2. Check Legacy Env (Raw)
  const allowed = (env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  return allowed.includes(normalized);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '*';

    // 0. Payload Size Enforcement
    const contentLength = request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return new Response('Payload Too Large', { 
        status: 413,
        headers: { 'Access-Control-Allow-Origin': origin }
      });
    }
    
    /**
     * Helper to create response with flexible CORS headers.
     * Reflects requested headers to support various client libraries/SDKs.
     */
    const corsResponse = (body: any, status = 200, headers: Record<string, string> = {}) => {
      const respHeaders = new Headers({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        ...headers
      });

      // Reflect requested headers for preflight
      const requestedHeaders = request.headers.get('Access-Control-Request-Headers');
      if (requestedHeaders) {
        respHeaders.set('Access-Control-Allow-Headers', requestedHeaders);
      }

      return new Response(body, { status, headers: respHeaders });
    };

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    // 2. Extract Bearer Token
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.split(' ')[1];

    if (!idToken) return corsResponse('Unauthorized: Missing Token', 401);

    // 3. Verify Token
    const payload = await verifyToken(idToken);
    if (!payload || !payload.email) {
      return corsResponse('Unauthorized: Invalid Token', 401);
    }

    // 4. Check Whitelist (Hashed KV or Legacy Env)
    if (!await isAllowed(payload.email, env)) {
      return corsResponse(`Forbidden: Email ${payload.email} not whitelisted`, 403);
    }

    const url = new URL(request.url);

    // Local diagnostic endpoint
    if (url.pathname === '/validate') {
      return corsResponse(JSON.stringify({ status: 'ok', email: payload.email }), 200, {
        'Content-Type': 'application/json'
      });
    }

    // 5. Transparent Proxy Relay to Gemini
    const geminiUrl = new URL(`https://generativelanguage.googleapis.com${url.pathname}${url.search}`);
    
    // Inject secret API key (overwrites any client-provided key)
    geminiUrl.searchParams.set('key', env.GEMINI_API_KEY);

    // Forward raw body and essential headers
    const geminiRes = await fetch(geminiUrl.toString(), {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'x-goog-api-client': request.headers.get('x-goog-api-client') || '',
      },
      body: request.method === 'GET' ? null : request.body
    });

    // Pipe the raw response body back to the client with CORS
    const contentType = geminiRes.headers.get('Content-Type');
    return corsResponse(geminiRes.body, geminiRes.status, {
      'Content-Type': contentType || 'application/json'
    });
  }
}
