import { config } from 'dotenv';

config();

import { db as postgres } from "./postgres";
import { redis as redisWrapper } from './redis';

export const db = postgres;
export const redis = redisWrapper;
redis.initialise();
