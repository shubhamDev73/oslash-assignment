import { NewShortcut, Shortcut, ShortcutScore } from "./interface";
import db, { couchbase } from "../db";
import { QueryResult } from "pg";

const APP_ID = "shortcut";

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
                const shortcutId = result.rows[0];

                // creating index for all search words with scores
                couchbase.append(APP_ID, userId, shortcut.shortlink, {shortcutId: shortcutId, score: 1});
                shortcut.description.split(" ").forEach(word => {
                    couchbase.append(APP_ID, userId, word, {shortcutId: shortcutId, score: 0.25});
                });
                shortcut.tags?.forEach(word => {
                    couchbase.append(APP_ID, userId, word, {shortcutId: shortcutId, score: 0.75});
                });

                callback(null, shortcutId);
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

export const searchShortcutsFromString = async (userId: string, query: string, callback: Function) => {
    couchbase.get(APP_ID, userId, query, (err, result) => {
        callback(err, result?.content);
    });
};
