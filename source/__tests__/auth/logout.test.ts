import { redis } from '../../db';
import { server } from '../../server'
import supertest from 'supertest'
import utils from '../../auth/utils';

const request = supertest(server);
const appId = "auth";

const sleep = (millis: number) => new Promise((resolve) => setTimeout(resolve, millis));

describe('Logout', () => {

    const username = 'test_logout_username';
    const password = 'test_logout_password';
    var token: string;
    var userId: number;

    beforeAll(async () => {
        const res = await request.post('/auth/register').send({username: username, password: password})
        token = res.body.token;
        const result = await utils.decodeToken(token);
        if (result.valid) { userId = result.session.userId; }
    });

    beforeEach(async () => {
        const res = await request.post('/auth/login').send({username: username, password: password})
        token = res.body.token;
    });

    afterAll(() => server.close());

    it('POST /auth/logout for correct user logs out and creates and expires redis entires', async () => {
        const res = await request.post('/auth/logout').set('Authorization', `Bearer ${token}`);

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({});

        await sleep(1000);
        expect(await redis.exists(appId, userId.toString(), token)).toBeTruthy()

        // expired also
        await sleep(12000);
        expect(await redis.exists(appId, userId.toString(), token)).toBeFalsy()
    });

    it('POST /shortcut/list for logged out user returns error', async () => {
        await request.post('/auth/logout').set('Authorization', `Bearer ${token}`);
        const res = await request.post('/shortcut/list').set('Authorization', `Bearer ${token}`);

        expect(res.status).toEqual(401);

        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');

        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid auth');
    });
  
    it('POST /auth/logout for invalid token returns error', async () => {
        const res = await request.post('/auth/logout').set('Authorization', `Bearer invalid${token}`);

        expect(res.status).toEqual(401);

        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');

        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid auth');
    });
  
});
