# TODO: Fix Cloudflare Worker CORS

- [x] **Bugfix: Dynamic CORS Handling**
    - [x] Update `worker/index.ts` with a dynamic origin whitelist.
    - [x] Handle `OPTIONS` preflight requests correctly.
    - [x] Add CORS headers to all response types (json, text, event-stream).
    - [x] Verify that `localhost` is allowed.
