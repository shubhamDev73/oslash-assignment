import { server } from '../../server'
import supertest from 'supertest'

import { getUserFromUsername } from '../../auth/dao';
import { User } from '../../auth/interface';

const request = supertest(server);

describe('Register', () => {

    afterAll(() => server.close());

    it('POST /auth/register creates user in db with hidden password and returns token', async () => {
        const username = 'test_register_username';
        const password = 'test_register_password';

        const res = await request.post('/auth/register').send({username: username, password: password})

        expect(res.status).toEqual(200);

        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('success');

        expect(res.body).toHaveProperty('token');

        getUserFromUsername(username)
        .then((user: User) => expect(user.password).not.toEqual(password));
    });
  
    it('POST /auth/register for existing username returns error', async () => {
        const username = 'test_register_username2';
        const password = 'test_register_password';

        await request.post('/auth/register').send({username: username, password: password})
        const res = await request.post('/auth/register').send({username: username, password: password})

        expect(res.status).toEqual(401);

        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');

        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid credentials');

        expect(res.body).not.toHaveProperty('token');
    });
  
});
