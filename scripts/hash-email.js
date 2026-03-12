/**
 * Helper script to hash an email for the Cloudflare KV Whitelist.
 * 
 * Usage: node scripts/hash-email.js <email>
 */

import { createHash } from 'crypto';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/hash-email.js <email>');
  process.exit(1);
}

const normalized = email.trim().toLowerCase();
const hash = createHash('sha256').update(normalized).digest('hex');

console.log('\n--- Whitelist Management Helper ---');
console.log(`Email:  ${email}`);
console.log(`Hash:   ${hash}`);
console.log('\n--- Wrangler Command (Add) ---');
console.log(`npx wrangler kv key put --remote --namespace-id <NAMESPACE_ID> "${hash}" "true"`);
console.log('\n--- Wrangler Command (Remove) ---');
console.log(`npx wrangler kv key delete --remote --namespace-id <NAMESPACE_ID> "${hash}"`);
console.log('-----------------------------------\n');
