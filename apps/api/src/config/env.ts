import { serverEnvSchema } from '@lifeos/config';
import type { ServerEnv } from '@lifeos/config';

/**
 * Validate and export server environment variables.
 * Crashes early if required env vars are missing.
 */
function loadEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
