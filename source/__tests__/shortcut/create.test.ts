import { server } from '../../server'
import supertest from 'supertest'
import { redis } from '../../db';
import utils from '../../auth/utils';
import { getShortcutFromShortlink } from '../../shortcut/dao';
import { NewShortcut, Shortcut } from '../../shortcut/interface';

const request = supertest(server);
const appId = 'shortcut';

const sleep = (millis: number) => new Promise((resolve) => setTimeout(resolve, millis));

describe('Create shortcut', () => {

    const username = 'test_create_username';
    const password = 'test_create_password';
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

    it('POST /shortcut/create for new shortcut creates shortcut and db entries', async () => {
        const shortcut = getShortcut();
        const res = await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut);

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('success');

        await sleep(1000);

        getShortcutFromShortlink(userId, shortcut.shortlink)
        .then(async (dbShortcut: Shortcut) => {
            expect(dbShortcut.url).toEqual(shortcut.url);
            expect(dbShortcut.shortlink).toEqual(shortcut.shortlink);
            expect(dbShortcut.description).toEqual(shortcut.description);
            expect(dbShortcut.tags).toEqual(shortcut.tags);

            var data;

            data = await redis.hGetAll(appId, userId, shortcut.shortlink);
            expect(parseFloat(data[dbShortcut.id])).toBeCloseTo(1);

            const descriptionWords = shortcut.description.split(" ");
            data = await redis.hGetAll(appId, userId, descriptionWords[0]);
            expect(parseFloat(data[dbShortcut.id])).toBeCloseTo(0.25);
            data = await redis.hGetAll(appId, userId, descriptionWords[1]);
            expect(parseFloat(data[dbShortcut.id])).toBeCloseTo(1);

            data = await redis.hGetAll(appId, userId, shortcut.tags[0]);
            expect(parseFloat(data[dbShortcut.id])).toBeCloseTo(0.75);
        });
    });

    it('POST /shortcut/create for invalid url returns error', async () => {
        let shortcut = getShortcut();
        shortcut.url = 'invalid-url';
        const res = await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut)

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid url');
    });

    it('POST /shortcut/create for new shortcut with empty tags is also valid', async () => {
        var shortcut: NewShortcut;
        var res;
        
        // empty tags
        shortcut = getShortcut();
        shortcut.tags = [];
        res = await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut)

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('success');

        // no tags
        shortcut = getShortcut();
        shortcut = {
            url: shortcut.url,
            shortlink: shortcut.shortlink,
            description: shortcut.description
        }
        res = await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut)

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('success');
    });

    it('POST /shortcut/create for invalid token returns error', async () => {
        const res = await request.post('/shortcut/create')
            .set('Authorization', 'Bearer sdfdsg')
            .send(getShortcut())

        expect(res.status).toEqual(401);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid auth');
    });

    it('POST /shortcut/create for new shortcut with existing shortlink returns error', async () => {
        const shortcut = getShortcut();

        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut);
        const res = await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcut);

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Shortlink already exists');
    });

});
