import { createNewShortcut, deleteShortcutFromShortlink, deleteWordShortcut, getAllShortcutsForUser, getShortcutFromShortlink, getShortcutsFromIds, insertShortcutScore, searchShortcutsFromWord } from './dao'
import { Request, Response, NextFunction } from 'express';
import { NewShortcut, Shortcut, ShortcutScore } from './interface';

const sendCorrectResponse = (res: Response) => res.status(200).json({message: "success"});
const sendErrorResponse = (res: Response, error: Error) => res.status(200).json({
    message: "error",
    error: error.message
});

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

function setWordScores (wordShortcutScores: Map<string, number>, words: string[], score: number) {
    for (const word of words) {
        if (wordShortcutScores.has(word)) {
            const oldScore: number = wordShortcutScores.get(word) ?? 0;
            wordShortcutScores.set(word, oldScore + score);
        } else {
            wordShortcutScores.set(word, score);
        }
    }
}

const createShortcut = (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.session.userId;
    const shortcut: NewShortcut = req.body;

    createNewShortcut(userId, shortcut)
    .then((shortcutId: number) => {
        let wordShortcutScores: Map<string, number> = new Map();

        // creating index for all search words with scores
        wordShortcutScores.set(shortcut.shortlink, 1);
        setWordScores(wordShortcutScores, shortcut.description.split(" "), 0.25);
        setWordScores(wordShortcutScores, shortcut.tags ?? [], 0.75);

        // creating corresponding redis entries
        wordShortcutScores.forEach((score: number, word: string) => {
            insertShortcutScore(userId, word, {shortcutId: shortcutId, score: score});
        });

        sendCorrectResponse(res);
    })
    .catch((err) => sendErrorResponse(res, err));
};

const listShortcuts = (req: Request, res: Response, next: NextFunction) => {
    getAllShortcutsForUser(res.locals.session.userId)
    .then((shortcuts: Shortcut[]) => res.status(200).json(getDisplayShortcuts(shortcuts)))
    .catch((err) => sendErrorResponse(res, err));
};

const deleteShortcut = (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.session.userId;
    const shortlink = req.params.shortlink;
    let words: Set<string> = new Set();
    var shortcutId: number;

    getShortcutFromShortlink(userId, shortlink)
    .then((shortcut: Shortcut) => {
        // creating set of all words
        words.add(shortcut.shortlink);
        shortcut.description.split(" ").forEach((word) => words.add(word));
        (shortcut.tags as unknown as string).split(",").forEach((word) => words.add(word));
        shortcutId = shortcut.id;
    })
    .then(() => deleteShortcutFromShortlink(userId, shortlink))
    .then(() => {
        // deleting all words redis entries
        words.forEach((word: string) => deleteWordShortcut(userId, word, shortcutId));
    })
    .then(() => sendCorrectResponse(res))
    .catch((err) => sendErrorResponse(res, err));
};

const searchShortcuts = (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.session.userId;
    const queryWords: string[] = (req.query.query as string).split(" ");
    let idShortcutScoreMapping: Map<number, ShortcutScore> = new Map();
    var numWordsSearchComplete: number = 0;

    // for each query word, search shortcuts and get scores
    new Promise<void>((resolve, reject) => {
        queryWords.forEach((word: string, index: number) => {
            searchShortcutsFromWord(userId, word)
            .then((shortcutScores: { [shortcutId: string]: string }) => {
                for (const id in shortcutScores) {
                    const shortcutId: number = parseInt(id);
                    const oldScore: number = idShortcutScoreMapping.get(shortcutId)?.score ?? 0;
                    idShortcutScoreMapping.set(shortcutId, {shortcutId: shortcutId, score: oldScore + parseFloat(shortcutScores[shortcutId])});
                }
                numWordsSearchComplete++;

                // if all words searched, resolve
                if (numWordsSearchComplete == queryWords.length) { resolve(); }
            })
            .catch(reject);
        });

    }).then(() => getShortcutsFromIds(userId, Array.from(idShortcutScoreMapping.keys())))

    .then((shortcuts: Shortcut[]) => {
        // finally display after sorting based on final score for shortcuts
        shortcuts.sort((a, b) => (idShortcutScoreMapping.get(b.id)?.score ?? 0) - (idShortcutScoreMapping.get(a.id)?.score ?? 0))
        return res.status(200).json(getDisplayShortcuts(shortcuts));

    }).catch((err) => sendErrorResponse(res, err));
};

export default { createShortcut, listShortcuts, deleteShortcut, searchShortcuts };
