import { server } from '../../server'
import supertest from 'supertest'
import utils from '../../auth/utils';
import { NewShortcut } from '../../shortcut/interface';
import shortcutController from '../../shortcut/controller';

const request = supertest(server);

const sleep = (millis: number) => new Promise((resolve) => setTimeout(resolve, millis));

function getShortcut () {
    return {
        url: "http://www.google.com/",
        shortlink: (Math.random() + 1).toString(36).substring(2),
        description: "description more",
        tags: ["tags", "more"]
    };
}

function createShortcutRequest (token: string, shortcut: NewShortcut) {
    return request.post('/shortcut/create')
    .set('Authorization', `Bearer ${token}`)
    .send(shortcut);
}

function searchQuery (token: string, query: string) {
    return request.get(`/shortcut/search?query=${query}`)
    .set('Authorization', `Bearer ${token}`);
}

const calculateSearchTimeForShortcuts = (token: string, userId: string, numShortcuts: number) => new Promise<number>(async (resolve, reject) => {
    const shortcut = getShortcut();

    await shortcutController.createShortcutDbEntries(userId, shortcut);
    await Promise.all(Array.from({length: numShortcuts}, (v, i) => 
            shortcutController.createShortcutDbEntries(userId, getShortcut())
    ));

    const startTime = performance.now();
    await searchQuery(token, shortcut.shortlink);
    const endTime = performance.now();

    resolve(endTime - startTime);
});

describe('Search shortcut', () => {

    const username = 'test_search_username';
    const password = 'test_search_password';
    var token: string;
    var userId: string;

    beforeAll(async () => {
        const res = await request.post('/auth/register').send({username: username, password: password})
        token = res.body.token;
        const result = await utils.decodeToken(token);
        if (result.valid) { userId = result.session.userId.toString(); }
    });

    beforeEach(async () => {
        // issue fresh token
        const res = await request.post('/auth/login').send({username: username, password: password})
        token = res.body.token;
        const result = await utils.decodeToken(token);
        if (result.valid) { userId = result.session.userId.toString(); }
    });

    afterAll(() => server.close());

    it('search works for shortlink, description and tags', async () => {
        const shortcut = getShortcut();
        var res;

        await createShortcutRequest(token, shortcut);

        await sleep(2000);

        res = await searchQuery(token, shortcut.shortlink);
        expect(res.status).toEqual(200);
        expect(res.body).toContainEqual(shortcut);

        res = await searchQuery(token, 'description');
        expect(res.status).toEqual(200);
        expect(res.body).toContainEqual(shortcut);

        res = await searchQuery(token, 'tags');
        expect(res.status).toEqual(200);
        expect(res.body).toContainEqual(shortcut);
    });

    it('search sorting order: shortlink > tags > description', async () => {
        const word = 'random_word';

        const shortlinkShortcut = {
            url: "http://www.google.com/",
            shortlink: word,
            description: "description more",
            tags: ["tags", "more"]
        };
        const tagShortcut = {
            url: "http://www.google.com/",
            shortlink: "shortlink_tag",
            description: "description more",
            tags: [word, "more"]
        };
        const descriptionShortcut = {
            url: "http://www.google.com/",
            shortlink: "shortlink_des",
            description: `${word} more`,
            tags: ["tags", "more"]
        };

        await createShortcutRequest(token, shortlinkShortcut);
        await createShortcutRequest(token, tagShortcut);
        await createShortcutRequest(token, descriptionShortcut);

        await sleep(4000);

        const res = await searchQuery(token, word);
        expect(res.body).toEqual([shortlinkShortcut, tagShortcut, descriptionShortcut]);
    });

    it('search for description + tags > only for one', async () => {
        const word = 'word2';

        const bothShortcut = {
            url: "http://www.google.com/",
            shortlink: "link1",
            description: `${word} test`,
            tags: ["tag", word]
        };
        const tagShortcut = {
            url: "http://www.google.com/",
            shortlink: "link2",
            description: "description mores",
            tags: [word, "morse"]
        };
        const descriptionShortcut = {
            url: "http://www.google.com/",
            shortlink: "link3",
            description: `words ${word}`,
            tags: ["tags", "more"]
        };

        await createShortcutRequest(token, bothShortcut);
        await createShortcutRequest(token, tagShortcut);
        await createShortcutRequest(token, descriptionShortcut);

        await sleep(4000);

        const res = await searchQuery(token, word);
        expect(res.body).toEqual([bothShortcut, tagShortcut, descriptionShortcut]);
    });

    it('search for empty results', async () => {
        const shortcut = getShortcut()
        await createShortcutRequest(token, shortcut);

        await sleep(2000);

        const res = await searchQuery(token, 'invalid' + shortcut.shortlink);
        expect(res.status).toEqual(200);
        expect(res.body).toEqual([]);
    });

    it('search time complexity independent of total shortcuts', async () => {
        const duration10 = await calculateSearchTimeForShortcuts(token, userId, 10);
        const duration100 = await calculateSearchTimeForShortcuts(token, userId, 100);
        const duration1000 = await calculateSearchTimeForShortcuts(token, userId, 1000);
        const duration10000 = await calculateSearchTimeForShortcuts(token, userId, 10000);

        // all durations are atmost 50 milliseconds apart
        expect(Math.abs(duration10 - duration100)).toBeLessThanOrEqual(50);
        expect(Math.abs(duration10 - duration1000)).toBeLessThanOrEqual(50);
        expect(Math.abs(duration10 - duration10000)).toBeLessThanOrEqual(50);
        expect(Math.abs(duration100 - duration1000)).toBeLessThanOrEqual(50);
        expect(Math.abs(duration100 - duration10000)).toBeLessThanOrEqual(50);
        expect(Math.abs(duration1000 - duration10000)).toBeLessThanOrEqual(50);
    });

});
