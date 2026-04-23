import { createDb } from '@lifeos/db';
import { env } from './env';

/**
 * Global DB client singleton.
 */
export const db = createDb(env.DATABASE_URL);
