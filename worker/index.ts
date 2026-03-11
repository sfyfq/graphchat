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
  // In production, use a library or properly verify JWT signature, exp, and aud.
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) return null;
  return await res.json();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.split(' ')[1];

    if (!idToken) {
      return new Response('Unauthorized: Missing Token', { status: 401 });
    }

    // 1. Verify Token & Extract Email
    const payload = await verifyToken(idToken);
    if (!payload || !payload.email) {
      return new Response('Unauthorized: Invalid Token', { status: 401 });
    }

    // 2. Check Whitelist
    const allowed = (env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    if (!allowed.includes(payload.email.toLowerCase())) {
      return new Response('Forbidden: Email not whitelisted', { status: 403 });
    }

    // 3. Simple validation endpoint
    if (url.pathname === '/validate') {
      return new Response(JSON.stringify({ status: 'ok', email: payload.email }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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

      if (!reader) return new Response('No Gemini response body', { status: 500 });

      // Process Gemini stream and yield raw text to frontend
      (async () => {
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          // Gemini returns JSON chunks in an array-like format. 
          // For simplicity in this proxy, we extract text and forward.
          try {
            // Note: This is a simplified parser for the Gemini NDJSON stream
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
        headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' }
      });
    } else {
      // Handle One-shot
      const data: any = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return new Response(JSON.stringify({ text }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
}
