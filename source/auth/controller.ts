import bcrypt from 'bcrypt';
import { createNewUser, expireToken, getUserFromUsername } from './dao';
import { Request, Response, NextFunction } from 'express';
import authUtils from './utils';
import { NewUser, User } from './interface';

const unauthorized = (res: Response) => res.status(401).json({
    message: "error",
    error: "Invalid credentials"
});

const register = (req: Request, res: Response, next: NextFunction) => {

    const hash = bcrypt.hashSync(req.body.password, 10);

    const user: NewUser = {
        username: req.body.username,
        password: hash,
    };

    createNewUser(user)
    .then((userId: number) => res.status(200).json({
        message: "success",
        token: authUtils.encodeUserId(userId)
    }))
    .catch((err) => unauthorized(res));
}

const login = (req: Request, res: Response, next: NextFunction) => {
    getUserFromUsername(req.body.username)
    .then((user: User) => {
        const result = bcrypt.compareSync(req.body.password, user.password);
        if (result) {
            return res.status(200).json({
                message: "success",
                token: authUtils.encodeUserId(user.id)
            });
        } else {
            return unauthorized(res);
        }
    })
    .catch((err) => unauthorized(res));
};

const logout = (req: Request, res: Response, next: NextFunction) => {
    expireToken(res.locals.token, res.locals.session)
    .then(() => res.status(200).end())
    .catch((err) => unauthorized(res));
};

export default { register, login, logout };
