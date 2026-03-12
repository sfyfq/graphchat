/**
 * Cloudflare Worker for GraphChat Secure Proxy
 * 
 * Acts as a transparent proxy for Gemini API, injecting Auth and API Key.
 * It is NOT smart about the model, path, or content.
 */

export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_EMAILS: string;
}

/**
 * Verify the Google ID Token using Google's tokeninfo endpoint.
 */
async function verifyToken(idToken: string) {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '*';
    
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

    // 4. Check Whitelist
    const allowed = (env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    if (!allowed.includes(payload.email.toLowerCase())) {
      return corsResponse(`Forbidden: Email ${payload.email} not whitelisted`, 403);
    }

    // 5. Transparent Proxy Relay to Gemini
    // Forward the exact path and query parameters to Google.
    const url = new URL(request.url);
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
