import db, { couchbase } from "../db";
import { QueryResult } from "pg";
import { NewUser, Session } from "./interface";

const APP_ID = "auth";

export const createNewUser = (user: NewUser, callback: Function) => {
    db.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id;",
        [user.username, user.password],

        (err: Error, result: QueryResult<any>) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result.rows[0].id);
            }
        }
    );
};

export const getUserFromUsername = (username: string, callback: Function) => {
    db.query(
        "SELECT * FROM users WHERE username = $1;",
        [username],

        (err: Error, result: QueryResult<any>) => {
            if (err || result.rowCount != 1) {
                callback(err);
            } else {
                callback(null, result.rows[0]);
            }
        }
    );
};

export const expireToken = (token: string, session: Session, callback: Function) => {
    couchbase.insert(APP_ID, session.userId.toString(), token, true, session.expires - Date.now(), (err, result) => callback());
}

export const checkToken = (token: string, session: Session, callback: Function) => {
    couchbase.exists(APP_ID, session.userId.toString(), token, null, (exists: boolean) => {
        callback(!exists && session.expires > Date.now());
    });
}
