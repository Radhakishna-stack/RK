import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Use a simple relative path — works on both Windows and Linux
// The adapter strips the "file:" prefix and opens the SQLite DB at that path
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

export default prisma;
