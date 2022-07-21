/** source/server.ts */
import http from 'http';
import express, { Request, Response, NextFunction, Express } from 'express';
import authRouter from './auth/routes';
import shortcutRouter from './shortcut/routes';
import authUtils from './auth/utils';

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
        return res.status(200).json({});
    }
    next();
});

// auth middleware (not applied on auth)
router.use(/\/((?!auth).)*/, (req: Request, res: Response, next: NextFunction) => {
    const unauthorized = (error: string) => res.status(401).json({
        message: "error",
        error: error
    });

    const auth: string = req.headers.authorization || '';
    const token: string = auth.substring(7);

    if (auth.length == 0 || token.length == 0) {
        return unauthorized("Token not found.");
    }

    const decodeResult = authUtils.decodeToken(token);

    if (!decodeResult.valid) {
        return unauthorized("Failed to decode or validate authorization token.");
    }

    res.locals.userId = decodeResult.userId;

    next();
});

// base routes
router.use('/auth', authRouter);
router.use('/shortcut', shortcutRouter);

// error handling
router.use((req, res, next) => {
    return res.status(404).json({
        message: 'error',
        error: 'not found'
    });
});

// server
const server = http.createServer(router);
const port: any = process.env.PORT ?? 8080;
server.listen(port, () => console.log(`The server is running on port ${port}`));
