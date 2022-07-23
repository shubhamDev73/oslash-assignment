import { db, redis } from "../db";
import { QueryResult } from "pg";
import { NewUser, Session, User } from "./interface";

const APP_ID = "auth";

export const createNewUser = (user: NewUser) => new Promise<number>((resolve, reject) => {
    db.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id;",
        [user.username, user.password],

        (err: Error, result: QueryResult<any>) => {
            if (err) { reject(err); }
            else { resolve(result.rows[0].id); }
        }
    );
});

export const getUserFromUsername = (username: string) => new Promise<User>((resolve, reject) => {
    db.query(
        "SELECT * FROM users WHERE username = $1;",
        [username],

        (err: Error, result: QueryResult<any>) => {
            if (err || result.rowCount != 1) { reject(err); }
            else { resolve(result.rows[0]); }
        }
    );
});

export const expireToken = (token: string, session: Session) => {
    return redis.insert(APP_ID, session.userId.toString(), token, 1, session.expires - Date.now())
};

export const checkToken = (token: string, session: Session) => new Promise<boolean>((resolve, reject) => {
    if (session.expires < Date.now()) { resolve(false); return; }
    redis.exists(APP_ID, session.userId.toString(), token)
    .then((exists: boolean) => resolve(!exists))
    .catch(reject);
});
