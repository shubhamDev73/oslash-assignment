import { createNewShortcut, deleteShortcutFromShortlink, deleteWordShortcut, getAllShortcutsForUser, getShortcutFromShortlink, getShortcutsFromIds, insertShortcutScore, searchShortcutsFromWord } from './dao'
import { Request, Response, NextFunction } from 'express';
import { NewShortcut, Shortcut, ShortcutScore } from './interface';

const sendCorrectResponse = (res: Response) => res.status(200).json({message: "success"});
const sendErrorResponse = (res: Response, error: String) => res.status(200).json({
    message: "error",
    error: error
});

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

const createShortcutDbEntries = async (userId: string, shortcut: NewShortcut) => {
    const shortcutId = await createNewShortcut(userId, shortcut);

    let wordShortcutScores: Map<string, number> = new Map();

    // creating index for all search words with scores
    wordShortcutScores.set(shortcut.shortlink, 1);
    setWordScores(wordShortcutScores, shortcut.description.split(" "), 0.25);
    setWordScores(wordShortcutScores, shortcut.tags ?? [], 0.75);

    // creating corresponding redis entries
    wordShortcutScores.forEach((score: number, word: string) => {
        insertShortcutScore(userId, word, { shortcutId: shortcutId, score: score });
    });
};

const createShortcut = (req: Request, res: Response, next: NextFunction) => {
    createShortcutDbEntries(res.locals.session.userId, req.body)
    .then(() => sendCorrectResponse(res))
    .catch((err) => sendErrorResponse(res, "Shortlink already exists"));
};

const listShortcuts = (req: Request, res: Response, next: NextFunction) => {
    getAllShortcutsForUser(res.locals.session.userId)
    .then((shortcuts: NewShortcut[]) => res.status(200).json(shortcuts))
    .catch((err) => sendErrorResponse(res, "Some error occurred"));
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
        shortcut.tags?.forEach((word) => words.add(word));
        shortcutId = shortcut.id;
    })
    .then(() => deleteShortcutFromShortlink(userId, shortlink))
    .then(() => {
        // deleting all words redis entries
        words.forEach((word: string) => deleteWordShortcut(userId, word, shortcutId));
    })
    .then(() => sendCorrectResponse(res))
    .catch((err) => sendErrorResponse(res, "Invalid shortlink"));
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
        shortcuts.sort((a, b) => (idShortcutScoreMapping.get(b.id)?.score ?? 0) - (idShortcutScoreMapping.get(a.id)?.score ?? 0));
        const displayShortcuts: NewShortcut[] = shortcuts.map((shortcut) => {
            return {
                url: shortcut.url,
                shortlink: shortcut.shortlink,
                description: shortcut.description,
                tags: shortcut.tags
            }
        });
        return res.status(200).json(displayShortcuts);
    }).catch((err) => sendErrorResponse(res, "Some error occurred"));
};

export default { createShortcutDbEntries, createShortcut, listShortcuts, deleteShortcut, searchShortcuts };
