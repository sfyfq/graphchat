import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['worker/**/*.{test,spec}.{ts,tsx}'],
    poolOptions: {
      workers: {
        wrangler: { configPath: 'wrangler.proxy.json' },
      },
    },
  },
});
