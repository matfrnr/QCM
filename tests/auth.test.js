const request = require('supertest');
const app = require('../src/app');

describe('Auth routes', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  let accessToken;
  let refreshToken;

  // ── Register ────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('crée un compte et retourne les tokens', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).not.toHaveProperty('password');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('rejette un email déjà utilisé', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      expect(res.status).toBe(409);
    });

    it('rejette un mot de passe trop court', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'other@test.com', password: '123' });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('connecte un utilisateur existant', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('rejette un mauvais mot de passe', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  // ── Me ──────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/auth/me', () => {
    it('retourne le profil avec un token valide', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('rejette sans token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ── Refresh ─────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/refresh', () => {
    it('émet de nouveaux tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('rejette un refresh token déjà utilisé (rotation)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(401);
    });
  });
});
