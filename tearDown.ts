import db from './source/db';

export default async () => {
    await db.query('DROP TABLE shortcuts;');
    await db.query('DROP TABLE users;');
    db.end();
}
