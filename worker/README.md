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

### 3. Set Up KV Namespace (Whitelist)
Create a new KV namespace for the privacy-preserving whitelist:
```bash
npx wrangler kv:namespace create WHITELIST_KV
```
Copy the `id` from the output and paste it into `worker/wrangler.proxy.json` under `kv_namespaces`.

### 4. Set Up Secrets
You must set your private Gemini API key and the guest whitelist as encrypted secrets. These will not be visible in your code.

**Gemini API Key:**
```bash
npx wrangler secret put GEMINI_API_KEY -c wrangler.proxy.json
# When prompted, paste your key from Google AI Studio
```

**Allowed Emails (Legacy Whitelist Fallback):**
```bash
npx wrangler secret put ALLOWED_EMAILS -c wrangler.proxy.json
# When prompted, enter a comma-separated list: "email1@gmail.com,email2@gmail.com"
```

### 5. Deploy
From the `worker/` directory, run:
```bash
npx wrangler deploy -c wrangler.proxy.json
```

Once deployed, copy the **Worker URL** provided in the output (e.g., `https://graphchat-proxy.your-subdomain.workers.dev`) and add it to your frontend `.env.local` as `VITE_WORKER_URL`.

---

## Whitelist Management

To add a user to the whitelist without exposing their email address:

1. **Generate the hash and command:**
   ```bash
   npm run whitelist:hash user@example.com
   ```
2. **Run the generated `wrangler` command:**
   ```bash
   npx wrangler kv:key put --binding WHITELIST_KV "<hash>" "true"
   ```

To remove a user:
```bash
npx wrangler kv:key delete --binding WHITELIST_KV "<hash>"
```

---

## Technical Flow
1. **Frontend:** Sends request with `Authorization: Bearer <ID_TOKEN>`.
2. **Worker:** Calls Google's tokeninfo API to verify the token.
3. **Worker:** Normalizes the email, computes its SHA-256 hash, and checks `WHITELIST_KV`.
4. **Worker:** If not found in KV, checks the legacy `ALLOWED_EMAILS` secret.
5. **Worker:** If authorized, fetches from Gemini using `GEMINI_API_KEY`.
6. **Worker:** Streams the result back to the frontend.
