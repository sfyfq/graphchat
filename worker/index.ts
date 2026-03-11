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
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Gemini returns a JSON array of objects. We need to find the start and end of objects.
          // In their stream format, it looks like: [ { ... }, { ... } ]
          // We look for objects between braces.
          let startIdx = buffer.indexOf('{');
          while (startIdx !== -1) {
            let braceCount = 0;
            let endIdx = -1;
            
            for (let i = startIdx; i < buffer.length; i++) {
              if (buffer[i] === '{') braceCount++;
              else if (buffer[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  endIdx = i;
                  break;
                }
              }
            }

            if (endIdx !== -1) {
              const objStr = buffer.slice(startIdx, endIdx + 1);
              try {
                const obj = JSON.parse(objStr);
                const textChunk = obj.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textChunk) {
                  await writer.write(encoder.encode(textChunk));
                }
              } catch (e) {
                console.error("Failed to parse JSON chunk", e);
              }
              buffer = buffer.slice(endIdx + 1);
              startIdx = buffer.indexOf('{');
            } else {
              break; // Wait for more data
            }
          }
        }
        writer.close();
      })();

      return new Response(readable, {
        headers: { 
          'Content-Type': 'text/plain', 
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
