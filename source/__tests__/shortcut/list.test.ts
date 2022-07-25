import { server } from '../../server'
import supertest from 'supertest'
import utils from '../../auth/utils';

const request = supertest(server);

const sleep = (millis: number) => new Promise((resolve) => setTimeout(resolve, millis));

describe('Create shortcut', () => {

    const username = 'test_list_username';
    const password = 'test_list_password';
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

    it('GET /shortcut/list for correct user lists shortcuts', async () => {
        const shortcuts = [getShortcut(), getShortcut()];
        var res: any;

        // no shortcuts
        res = await request.get('/shortcut/list').set('Authorization', `Bearer ${token}`)

        expect(res.status).toEqual(200);
        expect(res.body).toEqual([]);
    
        // 1 shortcut
        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcuts[0])

        res = await request.get('/shortcut/list').set('Authorization', `Bearer ${token}`)

        expect(res.status).toEqual(200);
        expect(res.body).toEqual([shortcuts[0]]);
    
        // multiple shortcuts
        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${token}`)
            .send(shortcuts[1])

        res = await request.get('/shortcut/list').set('Authorization', `Bearer ${token}`)

        expect(res.status).toEqual(200);
        const receivedShortcuts = res.body;

        if (receivedShortcuts[0].shortlink == shortcuts[0].shortlink) {
            expect(receivedShortcuts[0]).toEqual(shortcuts[0]);
            expect(receivedShortcuts[1]).toEqual(shortcuts[1]);
        } else {
            expect(receivedShortcuts[0]).toEqual(shortcuts[1]);
            expect(receivedShortcuts[1]).toEqual(shortcuts[0]);
        }
    });

    it('Sort works', async () => {
        var res;

        res = await request.post('/auth/register').send({username: username + '2', password: password})
        const newToken = res.body.token;

        let shortcuts = [getShortcut(), getShortcut(), getShortcut()];
        shortcuts[0].shortlink = "c";
        shortcuts[1].shortlink = "b";
        shortcuts[2].shortlink = "a";

        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${newToken}`)
            .send(shortcuts[0]);
        await sleep(1000);

        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${newToken}`)
            .send(shortcuts[1]);
        await sleep(1000);

        await request.post('/shortcut/create')
            .set('Authorization', `Bearer ${newToken}`)
            .send(shortcuts[2]);
        await sleep(1000);

        res = await request.get('/shortcut/list?sort=date').set('Authorization', `Bearer ${newToken}`);
        expect(res.body).toEqual(shortcuts);

        res = await request.get('/shortcut/list?sort=shortlink').set('Authorization', `Bearer ${newToken}`);
        expect(res.body).toEqual(shortcuts.reverse());
    });

    it('GET /shortcut/list for invalid token returns error', async () => {
        const res = await request.get('/shortcut/list')
            .set('Authorization', 'Bearer sdfdsg')

        expect(res.status).toEqual(401);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid auth');
    });

    it('GET /shortcut/list for expired token returns error', async () => {
        var res;

        // sleep for 12 seconds
        await sleep(12000);

        res = await request.get('/shortcut/list')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toEqual(401);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid auth');

        // logging in again works
        res = await request.post('/auth/login').send({username: username, password: password})

        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('success');
        expect(res.body).toHaveProperty('token');

        token = res.body.token;
        res = await request.get('/shortcut/list')
            .set('Authorization', `Bearer ${token}`)
        expect(res.status).toEqual(200);
    });

});
