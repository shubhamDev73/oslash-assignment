import { createNewShortcut, deleteShortcutFromShortlink, getAllShortcutsForUser, searchShortcutsFromString } from './dao'
import { Request, Response, NextFunction } from 'express';
import { Shortcut, ShortcutScore } from './interface';

function getDisplayShortcuts(shortcuts?: Shortcut[]) {
    return shortcuts?.map((shortcut: Shortcut) => {
        return {
            url: shortcut.url,
            shortlink: shortcut.shortlink,
            description: shortcut.description,
            tags: (shortcut.tags as unknown as string)?.split(",") ?? [],
        };
    }) ?? [];
}

const createShortcut = (req: Request, res: Response, next: NextFunction) => {
    return createNewShortcut(res.locals.userId, req.body, (err?: Error, result?: number) => {
        if (err != null) {
            return res.status(200).json({
                message: "error",
                error: err.message
            });
        }

        return res.status(200).json({
            message: "success"
        });
    });
};

const listShortcuts = (req: Request, res: Response, next: NextFunction) => {
    return getAllShortcutsForUser(res.locals.userId, (err?: Error, shortcuts?: Shortcut[]) => {
        if (err != null) {
            return res.status(200).json({
                message: "error",
                error: err.message
            });
        }

        return res.status(200).json(getDisplayShortcuts(shortcuts));
    });
};

const deleteShortcut = (req: Request, res: Response, next: NextFunction) => {
    return deleteShortcutFromShortlink(res.locals.userId, req.params.shortlink, (err?: Error) => {
        if (err != null) {
            return res.status(200).json({
                message: "error",
                error: err.message
            });
        }

        return res.status(200).end();
    });
};

const searchShortcuts = (req: Request, res: Response, next: NextFunction) => {
    const query: string = req.query.query as string;
    const queryWords: string[] = query.split(" ");
    let wordShortcutScores: ShortcutScore[][] = queryWords.map((word: string) => []);
    let idShortcutScoreMapping: Map<number, ShortcutScore> = new Map();
    var numWordsSearchComplete: number = 0;

    // for each query word, search shortcuts and get scores
    new Promise<void>((resolve, reject) => {
        queryWords.forEach((word: string, index: number) => {
            searchShortcutsFromString(res.locals.userId, word, (err: Error, shortcutScores?: ShortcutScore[]) => {
                if (err) { reject(err); }

                wordShortcutScores[index] = shortcutScores ?? [];
                numWordsSearchComplete++;

                // if all words searched, resolve
                if (numWordsSearchComplete == queryWords.length) { resolve(); }
            });
        });
    }).then(() => {
        // combine wordShortcutScores to calculate final score for a shortcut from sum of all word scores
        for (const shortcutScores of wordShortcutScores) {
            for (const shortcutScore of shortcutScores) {
                const shortcutId: number = shortcutScore.shortcutId;
                const oldScore: number = idShortcutScoreMapping.get(shortcutId)?.score ?? 0;
                idShortcutScoreMapping.set(shortcutId, {shortcutId: shortcutId, score: oldScore + shortcutScore.score});
            }
        }

        // finally display after sorting based on final score for shortcuts
        return res.status(200).json(
            Array.from(idShortcutScoreMapping.values())
            .sort((a: ShortcutScore, b: ShortcutScore) => b.score - a.score)
            .map((value: ShortcutScore) => value.shortcutId)
        );
    }).catch((err) => {
        return res.status(200).json({
            message: "error",
            error: err.message
        });
    });
};

export default { createShortcut, listShortcuts, deleteShortcut, searchShortcuts };
