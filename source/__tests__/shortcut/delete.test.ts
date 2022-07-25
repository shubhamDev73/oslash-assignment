import { server } from '../../server'
import supertest from 'supertest'
import { redis } from '../../db';
import utils from '../../auth/utils';
import { getShortcutFromShortlink } from '../../shortcut/dao';

const request = supertest(server);
const appId = 'shortcut';

const sleep = (millis: number) => new Promise((resolve) => setTimeout(resolve, millis));

describe('Delete shortcut', () => {

    const username = 'test_delete_username';
    const password = 'test_delete_password';
    var token: string;
    var userId: string;

    const getShortcut = () => {
        return {
            url: "http://www.google.com/",
            shortlink: (Math.random() + 1).toString(36).substring(3),
            description: "description more",
            tags: ["tags", "more"]
        };
    }

    beforeAll(async () => {
        const res = await request.post('/auth/register').send({username: username, password: password})
        token = res.body.token;
        const result = await utils.decodeToken(token);
        if (result.valid) { userId = result.session.userId.toString(); }
    });

    afterAll(() => server.close());

    it('DEL /shortcut/delete/shortlink for valid shortlink deletes db entries', async () => {
        const shortcut = getShortcut();
        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut);

        await sleep(1000);

        const res = await request.del(`/shortcut/delete/${shortcut.shortlink}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('success');

        getShortcutFromShortlink(userId, shortcut.shortlink)
        .then(() => expect(false).toBeTruthy())
        .catch(() => expect(true).toBeTruthy());

        expect(await redis.exists(appId, userId, shortcut.shortlink)).toBeFalsy();
    });

    it('DEL /shortcut/delete/shortlink for invalid token returns error', async () => {
        const shortcut = getShortcut();
        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut)

        const res = await request.del(`/shortcut/delete/${shortcut.shortlink}`)
            .set('Authorization', `Bearer invalid${token}`)

        expect(res.status).toEqual(401);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid auth');
    });

    it('DEL /shortcut/delete/shortlink for invalid user returns error', async () => {
        const shortcut = getShortcut();
        var res;

        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut);

        res = await request.post('/auth/register').send({username: username + '_new', password: password})
        res = await request.del(`/shortcut/delete/${shortcut.shortlink}`)
            .set('Authorization', `Bearer ${res.body.token}`)

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid shortlink');
    });

    it('DEL /shortcut/delete/shortlink for not existing shortlink returns error', async () => {
        const res = await request.del(`/shortcut/delete/invalid`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid shortlink');
    });

});
