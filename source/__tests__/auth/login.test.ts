import { server } from '../../server'
import supertest from 'supertest'

const request = supertest(server);

describe('Login', () => {

    const username = 'test_login_username';
    const password = 'test_login_password';

    beforeAll(async () => {
        await request.post('/auth/register').send({username: username, password: password})
    });

    afterAll(() => server.close());

    it('POST /auth/login for correct user logs in and returns token', async () => {
        const res = await request.post('/auth/login').send({username: username, password: password})

        expect(res.status).toEqual(200);

        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('success');

        expect(res.body).toHaveProperty('token');
    });

    it('POST /auth/login for not existing username returns error', async () => {
        const res = await request.post('/auth/login').send({username: 'test_login_invalid_username', password: password})

        expect(res.status).toEqual(401);

        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');

        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid credentials');

        expect(res.body).not.toHaveProperty('token');
    });
  
    it('POST /auth/login for invalid password returns error', async () => {
        const res = await request.post('/auth/login').send({username: username, password: 'test_login_invalid_password'})

        expect(res.status).toEqual(401);

        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toEqual('error');

        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toEqual('Invalid credentials');

        expect(res.body).not.toHaveProperty('token');
    });
  
});
