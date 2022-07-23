import { db } from './source/db';
import fs from 'fs'

export default async () => {
    const data = fs.readFileSync('C:\\Users\\SHUBHAM\\Desktop\\oslash\\tables.sql', 'utf-8');
    await db.query(data);
}
