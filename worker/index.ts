/**
 * Cloudflare Worker for GraphChat Secure Proxy
 * 
 * Acts as a transparent proxy for Gemini API, injecting Auth and API Key.
 */

export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_EMAILS: string;
}

async function verifyToken(idToken: string) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) return null;
  return await res.json();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '*';
    
    // Helper for CORS-enabled responses
    const corsResponse = (body: any, status = 200, headers: Record<string, string> = {}) => {
      return new Response(body, {
        status,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          ...headers
        }
      });
    };

    if (request.method === 'OPTIONS') return corsResponse(null, 204);

    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.split(' ')[1];

    if (!idToken) return corsResponse('Unauthorized: Missing Token', 401);

    // 1. Verify Token & Extract Email
    const payload = await verifyToken(idToken);
    if (!payload || !payload.email) {
      return corsResponse('Unauthorized: Invalid Token', 401);
    }

    // 2. Check Whitelist
    const allowed = (env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    if (!allowed.includes(payload.email.toLowerCase())) {
      return corsResponse('Forbidden: Email not whitelisted', 403);
    }

    // 3. Local diagnostic endpoint
    if (url.pathname === '/validate') {
      return corsResponse(JSON.stringify({ status: 'ok', email: payload.email }), 200, {
        'Content-Type': 'application/json'
      });
    }

    // 4. Transparent Proxy to Gemini
    // Forward everything after the domain to Google
    const geminiUrl = new URL(`https://generativelanguage.googleapis.com${url.pathname}${url.search}`);
    geminiUrl.searchParams.set('key', env.GEMINI_API_KEY);

    // Forward the request body and essential headers
    const geminiRes = await fetch(geminiUrl.toString(), {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
      },
      body: request.method === 'GET' ? null : request.body
    });

    // Pipe the response body back to the client
    return corsResponse(geminiRes.body, geminiRes.status, {
      'Content-Type': geminiRes.headers.get('Content-Type') || 'application/json'
    });
  }
}
