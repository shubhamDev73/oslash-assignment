import { Request, Response, NextFunction } from 'express';

const createShortcut = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: "success"
    });
};

const listShortcuts = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200);
};

const deleteShortcut = (req: Request, res: Response, next: NextFunction) => {
    let shortlink: string = req.params.shortlink;
    return res.status(200).json({
        message: "success",
        shortlink: shortlink,
    });
};

const searchShortcuts = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200);
};

export default { createShortcut, listShortcuts, deleteShortcut, searchShortcuts };
