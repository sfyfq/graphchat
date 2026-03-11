# Bugfix: Resolve Cloudflare Build Conflict

## Objective
Prevent Cloudflare Pages from misidentifying the project as a Worker by renaming the backend configuration file and updating the deployment guide.

## 1. Rename Configuration (`worker/`)
- Rename `worker/wrangler.json` to `worker/wrangler.proxy.json`.
- This naming convention ensures the Pages build pipeline ignores it while remaining identifiable for manual use.

## 2. Update Deployment Guide (`worker/README.md`)
- Update all `npx wrangler` commands to include the `-c wrangler.proxy.json` flag.
- Specifically update:
    - Secret placement: `npx wrangler secret put GEMINI_API_KEY -c wrangler.proxy.json`
    - Deployment: `npx wrangler deploy -c wrangler.proxy.json`
