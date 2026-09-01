import request from 'supertest';
import app from '../src/index';

const credentials = {
    email: 'mobile@example.com',
    username: 'mobileuser',
    password: 'Password123!'
};
const device = { deviceId: 'android-test-device-001', deviceName: 'Pixel Test' };

describe('Mobile authentication', () => {
    it('rotates refresh tokens, rejects replay and supports session revocation', async () => {
        await request(app).post('/api/v1/auth/register').send(credentials).expect(201);

        const login = await request(app).post('/api/v1/auth/mobile/login').send({
            identifier: credentials.email,
            password: credentials.password,
            ...device
        }).expect(200);

        expect(login.body).toMatchObject({
            tokenType: 'Bearer', accessToken: expect.any(String),
            refreshToken: expect.any(String), expiresIn: 900
        });

        const firstRefreshToken = login.body.refreshToken as string;
        const rotated = await request(app).post('/api/v1/auth/mobile/refresh').send({
            refreshToken: firstRefreshToken, deviceId: device.deviceId
        }).expect(200);
        expect(rotated.body.refreshToken).not.toBe(firstRefreshToken);

        await request(app).post('/api/v1/auth/mobile/refresh').send({
            refreshToken: firstRefreshToken, deviceId: device.deviceId
        }).expect(401);

        const sessions = await request(app).get('/api/v1/auth/sessions')
            .set('Authorization', `Bearer ${rotated.body.accessToken}`)
            .expect(200);
        const mobileSession = sessions.body.find((session: { deviceId: string | null }) => session.deviceId === device.deviceId);
        expect(mobileSession).toMatchObject({ deviceName: device.deviceName, clientType: 'mobile' });
        expect(mobileSession).not.toHaveProperty('token');

        await request(app).delete(`/api/v1/auth/sessions/${mobileSession.id}`)
            .set('Authorization', `Bearer ${rotated.body.accessToken}`)
            .expect(204);

        await request(app).post('/api/v1/auth/mobile/refresh').send({
            refreshToken: rotated.body.refreshToken, deviceId: device.deviceId
        }).expect(401);
    });

    it('binds a mobile refresh token to its device identifier', async () => {
        await request(app).post('/api/v1/auth/register').send(credentials).expect(201);
        const login = await request(app).post('/api/v1/auth/mobile/login').send({
            identifier: credentials.email, password: credentials.password, ...device
        }).expect(200);

        await request(app).post('/api/v1/auth/mobile/refresh').send({
            refreshToken: login.body.refreshToken,
            deviceId: 'another-device-identifier'
        }).expect(401);
    });
});
