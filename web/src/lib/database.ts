import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from "../../drizzle-schema";

const client = createClient({ url: process.env.DB_FILE_NAME! });
export const db = drizzle(client, { schema, logger: false });
