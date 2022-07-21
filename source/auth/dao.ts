import db from "../db";
import { QueryResult } from "pg";
import { NewUser } from "./interface";

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
