# Request: Fix Cloudflare Pages Build Conflict

The Cloudflare Pages build is failing because it incorrectly identifies the repository as a Worker project due to the presence of `worker/wrangler.json`.

## Requirements:
- **De-conflict Build:** Rename `worker/wrangler.json` to something non-standard (e.g., `wrangler.proxy.json`) so the Pages builder ignores it.
- **Update Documentation:** Update `worker/README.md` to reflect the new config filename for manual deployment.
- **Verification:** Ensure the Worker can still be deployed manually with the new filename.
