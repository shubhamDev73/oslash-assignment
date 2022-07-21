import { Request, Response, NextFunction } from 'express';
import authUtils from './utils';

const login = (req: Request, res: Response, next: NextFunction) => {
    let token = authUtils.encodeUserId("userId");
    return res.status(200).json({
        message: "success",
        token: token
    });
};

const logout = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200);
};

export default { login, logout };
