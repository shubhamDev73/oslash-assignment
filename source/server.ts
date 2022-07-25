import http from 'http';
import express, { Request, Response, NextFunction, Express } from 'express';
import authRouter from './auth/routes';
import shortcutRouter from './shortcut/routes';
import authUtils from './auth/utils';
import { DecodeResult } from './auth/interface';

const router: Express = express();

// parse the request body
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// set the CORS policy, headers and method headers
router.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'origin, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET POST DELETE');
        return res.status(200).end();
    }
    next();
});

// auth middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const unauthorized = () => res.status(401).json({
        message: "error",
        error: "Invalid auth"
    });

    const auth: string = req.headers.authorization || '';
    const token: string = auth.substring(7);

    if (auth.length == 0 || token.length == 0) {
        return unauthorized();
    }

    authUtils.decodeToken(token)
    .then((decodeResult: DecodeResult) => {
        if (!decodeResult.valid) {
            return unauthorized();
        }
    
        res.locals.session = decodeResult.session;
        res.locals.token = token;
    
        next();
    })
    .catch((err) => unauthorized());
}

// base routes
router.use('/auth/logout', authMiddleware);
router.use('/auth', authRouter);
router.use(authMiddleware);
router.use('/shortcut', shortcutRouter);

// error handling
router.use((req, res, next) => res.status(404).json({
    message: 'error',
    error: 'not found'
}));

// server
export const server = http.createServer(router);
const randomPort = Math.floor(Math.random() * 1000) + 8000;
const port = process.env.NODE_ENV == 'test' ? randomPort : 8080;
server.listen(port, () => console.log(`The server is running on port ${port}`));
