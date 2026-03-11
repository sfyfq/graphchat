/**
 * Cloudflare Worker for GraphChat Secure Proxy
 * 
 * Environment Variables needed:
 * - GEMINI_API_KEY: Your Google Gemini API Key
 * - ALLOWED_EMAILS: A comma-separated list of authorized emails (e.g. "friend1@gmail.com,friend2@gmail.com")
 */

export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_EMAILS: string;
}

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

async function verifyToken(idToken: string) {
  // Simple verification for the prototype.
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) return null;
  return await res.json();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '*';
    
    // Helper to create response with CORS headers
    const corsResponse = (body: any, status = 200, headers: Record<string, string> = {}) => {
      return new Response(body, {
        status,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          ...headers
        }
      });
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.split(' ')[1];

    if (!idToken) {
      return corsResponse('Unauthorized: Missing Token', 401);
    }

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

    // 3. Simple validation endpoint
    if (url.pathname === '/validate') {
      return corsResponse(JSON.stringify({ status: 'ok', email: payload.email }), 200, {
        'Content-Type': 'application/json'
      });
    }

    // 4. Proxy to Gemini
    const body: any = await request.json();
    const { conv, newText } = body;

    // Construct Gemini API URL
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:${url.pathname === '/stream' ? 'streamGenerateContent' : 'generateContent'}?key=${env.GEMINI_API_KEY}`;

    // Map GraphChat conversation to Gemini format
    const contents = conv.history.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: m.parts
    }));
    contents.push({ role: 'user', parts: [{ text: newText }] });

    const geminiBody = {
      contents,
      systemInstruction: conv.systemInstruction ? { parts: [{ text: conv.systemInstruction }] } : undefined
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (url.pathname === '/stream') {
      // Handle Streaming
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = geminiRes.body?.getReader();

      if (!reader) return corsResponse('No Gemini response body', 500);

      // Process Gemini stream and yield raw text to frontend
      (async () => {
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          try {
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.trim().startsWith('"text":')) {
                const match = line.match(/"text":\s*"(.*)"/);
                if (match) await writer.write(encoder.encode(match[1]));
              }
            }
          } catch (e) {}
        }
        writer.close();
      })();

      return new Response(readable, {
        headers: { 
          'Content-Type': 'text/event-stream', 
          'Access-Control-Allow-Origin': origin 
        }
      });
    } else {
      // Handle One-shot
      const data: any = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return corsResponse(JSON.stringify({ text }), 200, {
        'Content-Type': 'application/json'
      });
    }
  }
}
