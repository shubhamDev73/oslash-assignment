import { Request, Response, NextFunction } from 'express';

const login = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: "success",
        token: ""
    });
};

const logout = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200);
};

export default { login, logout };
