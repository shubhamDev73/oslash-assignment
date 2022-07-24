import { db, redis } from './source/db';

export default async () => {
    await db.query('DROP TABLE shortcuts;');
    await db.query('DROP TABLE users;');
    await db.end();
    await redis.close();
}
