import { NewShortcut } from "./interface";
import db from "../db";
import { QueryResult } from "pg";

export const createNewShortcut = (userId: string, shortcut: NewShortcut, callback: Function) => {
    if (shortcut.tags != null && shortcut.tags.length == 0) {
        shortcut.tags = undefined;
    }

    db.query(
        "INSERT INTO shortcuts (user_id, url, shortlink, description, tags) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
        [userId, shortcut.url, shortcut.shortlink, shortcut.description, shortcut.tags?.join(",")],

        (err: Error, result: QueryResult<any>) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result.rows[0]);
            }
        }
    );
};

export const getAllShortcutsForUser = (userId: string, callback: Function) => {
    db.query(
        "SELECT * FROM shortcuts WHERE user_id = $1;",
        [userId],

        (err: Error, result: QueryResult<any>) => {
            if (err) {
                callback(err);
            } else {
                callback(null, result.rows);
            }
        }
    );
};

export const deleteShortcutFromShortlink = (userId: string, shortlink: string, callback: Function) => {
    db.query(
        "DELETE FROM shortcuts WHERE user_id = $1 AND shortlink = $2;",
        [userId, shortlink],

        (err: Error, result: QueryResult<any>) => {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        }
    );
};
