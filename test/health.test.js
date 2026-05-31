import request from 'supertest';
import { createApp } from '../src/app.js';
describe('health endpoint', () => {
    it('returns ok', async () => {
        const app = createApp();
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('ok');
    });
});
