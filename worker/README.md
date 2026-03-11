# Cloudflare Worker: Secure LLM Proxy

This worker acts as a secure intermediary between the GraphChat frontend and the Google Gemini API. It handles Google OAuth token verification and restricts access to a specific email whitelist.

## Deployment Guide

### 1. Install Wrangler
If you haven't already, install the Cloudflare CLI:
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```

### 3. Set Up Secrets
You must set your private Gemini API key and the guest whitelist as encrypted secrets. These will not be visible in your code.

**Gemini API Key:**
```bash
npx wrangler secret put GEMINI_API_KEY
# When prompted, paste your key from Google AI Studio
```

**Allowed Emails (Whitelist):**
```bash
npx wrangler secret put ALLOWED_EMAILS
# When prompted, enter a comma-separated list: "email1@gmail.com,email2@gmail.com"
```

### 4. Deploy
From the `worker/` directory, run:
```bash
npx wrangler deploy
```

Once deployed, copy the **Worker URL** provided in the output (e.g., `https://graphchat-proxy.your-subdomain.workers.dev`) and add it to your frontend `.env.local` as `VITE_WORKER_URL`.

---

## Technical Flow
1. **Frontend:** Sends request with `Authorization: Bearer <ID_TOKEN>`.
2. **Worker:** Calls Google's tokeninfo API to verify the token.
3. **Worker:** Extracts the user's email and checks it against `ALLOWED_EMAILS`.
4. **Worker:** If authorized, fetches the response from Gemini using `GEMINI_API_KEY`.
5. **Worker:** Streams the result back to the frontend.
