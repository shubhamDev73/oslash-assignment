import { Pool } from 'pg';

export const db = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.NODE_ENV == 'test' ? process.env.POSTGRES_TEST_DB : process.env.POSTGRES_DB
});
