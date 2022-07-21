import { createNewShortcut, deleteShortcutFromShortlink, getAllShortcutsForUser } from './dao'
import { Request, Response, NextFunction } from 'express';
import { Shortcut } from './interface';

function getDisplayShortcuts(shortcuts: Shortcut[]) {
    return shortcuts.map((shortcut: Shortcut) => {
        return {
            url: shortcut.url,
            shortlink: shortcut.shortlink,
            description: shortcut.description,
            tags: (shortcut.tags as unknown as string)?.split(",") ?? [],
        };
    });
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

        return res.status(200).json(getDisplayShortcuts(shortcuts ?? []));
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
    return res.status(200);
};

export default { createShortcut, listShortcuts, deleteShortcut, searchShortcuts };
