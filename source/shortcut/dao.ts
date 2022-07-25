import { NewShortcut, Shortcut, ShortcutScore } from "./interface";
import { db, redis } from "../db";
import { QueryResult } from "pg";

const APP_ID = "shortcut";

export const createNewShortcut = (userId: string, shortcut: NewShortcut) => new Promise<number>((resolve, reject) => {
    db.query(
        "INSERT INTO shortcuts (user_id, url, shortlink, description, tags) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
        [userId, shortcut.url, shortcut.shortlink, shortcut.description, shortcut.tags],

        (err: Error, result: QueryResult<any>) => {
            if (err) { reject(err); }
            else { resolve(result.rows[0].id); }
        }
    );
});

export const getShortcutFromShortlink = (userId: string, shortlink: string) => new Promise<Shortcut>((resolve, reject) => {
    db.query(
        "SELECT id, url, shortlink, description, tags FROM shortcuts WHERE user_id = $1 AND shortlink = $2;",
        [userId, shortlink],

        (err: Error, result: QueryResult<any>) => {
            if (err || result.rowCount != 1) { reject(err); }
            else { resolve(result.rows[0]); }
        }
    );
});

export const getShortcutsFromIds = (userId: string, ids: number[]) => new Promise<Shortcut[]>((resolve, reject) => {
    db.query(
        "SELECT id, url, shortlink, description, tags FROM shortcuts WHERE user_id = $1 AND id = ANY($2);",
        [userId, `{${ids.join(",")}}`],

        (err: Error, result: QueryResult<any>) => {
            if (err) { reject(err); }
            else { resolve(result.rows); }
        }
    );
});

export const getAllShortcutsForUser = (userId: string) => new Promise<NewShortcut[]>((resolve, reject) => {
    db.query(
        "SELECT url, shortlink, description, tags FROM shortcuts WHERE user_id = $1 ORDER BY id;",
        [userId],

        (err: Error, result: QueryResult<any>) => {
            if (err) { reject(err); }
            else { resolve(result.rows); }
        }
    );
});

export const deleteShortcutFromShortlink = (userId: string, shortlink: string) => new Promise<void>((resolve, reject) => {
    db.query(
        "DELETE FROM shortcuts WHERE user_id = $1 AND shortlink = $2 RETURNING id;",
        [userId, shortlink],

        (err: Error, result: QueryResult<any>) => {
            if (err || result.rowCount != 1) { reject(err); }
            else { resolve(); }
        }
    );
});

export const insertShortcutScore = (userId: string, word: string, shortcutScore: ShortcutScore) => {
    return redis.hSet(APP_ID, userId, word, shortcutScore.shortcutId.toString(), shortcutScore.score);
};

export const deleteWordShortcut = (userId: string, word: string, shortcutId: number) => {
    return redis.hDel(APP_ID, userId, word, shortcutId.toString());
};

export const searchShortcutsFromWord = (userId: string, word: string) => {
    return redis.hGetAll(APP_ID, userId, word);
};
