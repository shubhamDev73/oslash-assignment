/** source/server.ts */
import http from 'http';
import express, { Request, Response, NextFunction, Express } from 'express';

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
