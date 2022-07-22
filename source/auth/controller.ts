import bcrypt from 'bcrypt';
import { createNewUser, expireToken, getUserFromUsername } from './dao';
import { Request, Response, NextFunction } from 'express';
import authUtils from './utils';
import { NewUser, User } from './interface';

const register = (req: Request, res: Response, next: NextFunction) => {
    const unauthorized = () => res.status(401).json({
        message: "error",
        error: "Invalid credentials"
    });

    return bcrypt.hash(req.body.password, 10, (err?: Error, hash?: string) => {
        if (err != null || hash == null) {
            return unauthorized();
        }

        const user: NewUser = {
            username: req.body.username,
            password: hash,
        }
        return createNewUser(user, (err?: Error, userId?: number) => {
            if (err != null || userId == null) {
                return unauthorized();
            }

            return res.status(200).json({
                message: "success",
                token: authUtils.encodeUserId(userId)
            });
        });
    });
}

const login = (req: Request, res: Response, next: NextFunction) => {
    const unauthorized = () => res.status(401).json({
        message: "error",
        error: "Invalid credentials"
    });

    return getUserFromUsername(req.body.username, (err?: Error, user?: User) => {
        if (err != null || user == null) {
            return unauthorized();
        }

        return bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (result) {
                return res.status(200).json({
                    message: "success",
                    token: authUtils.encodeUserId(user.id)
                });
            } else {
                return unauthorized();
            }
        });
    });
};

const logout = (req: Request, res: Response, next: NextFunction) => {
    return expireToken(res.locals.token, res.locals.session, () => {
        return res.status(200);
    });
};

export default { register, login, logout };
