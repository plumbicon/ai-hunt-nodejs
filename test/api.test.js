const request = require('supertest');
const app = require('../src/app');
const { execSync } = require('child_process');
const db = require('../src/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper to sign tokens for tests
const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
};


describe('API Endpoints', () => {

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    
    try {
      console.log('Attempting to create test database...');
      execSync('npx sequelize-cli db:create --env test', { stdio: 'pipe', encoding: 'utf-8' });
      console.log('Test database created successfully.');
    } catch (error) {
      const stderr = error.stderr || '';
      if (stderr.includes('already exists')) {
        console.log('Test database already exists. Proceeding...');
      } else {
        console.error('FATAL: Failed to create test database.', { stderr, stdout: error.stdout });
        process.exit(1);
      }
    }

    try {
      console.log('Running migrations...');
      execSync('npx sequelize-cli db:migrate --env test', { stdio: 'inherit' });
    } catch (migrationError) {
      console.error("FATAL: Migrations failed.", migrationError);
      process.exit(1);
    }
  });

  afterAll(async () => {
    try {
      console.log('Closing database connections...');
      await db.sequelize.close(); // Gracefully close connections

      console.log('Rolling back migrations...');
      execSync('npx sequelize-cli db:migrate:undo:all --env test', { stdio: 'inherit' });

      console.log('Dropping test database...');
      execSync('npx sequelize-cli db:drop --env test', { stdio: 'inherit' });
    } catch (error) {
      console.error("Warning: Failed during test teardown. You may need to drop the test database manually.", error);
    }
  });

  // --- Auth Tests ---
  describe('Auth Endpoints', () => {
    it('should register a new user successfully', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const response = await request(app).post('/api/auth/register').send({
        email: uniqueEmail,
        password: 'password123',
        fullName: 'Test User',
        birthDate: '1990-01-01'
      });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should fail to register a user with a duplicate email', async () => {
        const uniqueEmail = `testuser_${Date.now()}@example.com`;
        const userData = { email: uniqueEmail, password: 'password123', fullName: 'Test User', birthDate: '1990-01-01' };
        await request(app).post('/api/auth/register').send(userData);
        const secondResponse = await request(app).post('/api/auth/register').send(userData);
        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body).toHaveProperty('message', 'User with this email already exists.');
    });

    describe('POST /api/auth/login', () => {
      const loginUser = { email: `loginuser_${Date.now()}@example.com`, password: 'securepassword123', fullName: 'Login User', birthDate: '1985-05-15' };
      beforeAll(async () => {
        await request(app).post('/api/auth/register').send(loginUser);
      });
      it('should login successfully with correct credentials', async () => {
        const response = await request(app).post('/api/auth/login').send({ email: loginUser.email, password: loginUser.password });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });
      it('should fail to login with an incorrect password', async () => {
        const response = await request(app).post('/api/auth/login').send({ email: loginUser.email, password: 'wrongpassword' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Authentication failed: Invalid password.');
      });
      it('should fail to login with a non-existent email', async () => {
        const response = await request(app).post('/api/auth/login').send({ email: 'nosuchuser@example.com', password: 'anypassword' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Authentication failed: User not found.');
      });
    });
  });

  // --- User Management Tests ---
  describe('User Management Endpoints', () => {
    let regularUser, adminUser, regularToken, adminToken;

    beforeAll(async () => {
      const saltRounds = 10;
      const regularPassword = 'password123';
      const adminPassword = 'adminpassword456';
      
      regularUser = await db.User.create({
        fullName: 'Regular User',
        birthDate: '1995-01-01',
        email: 'regular@example.com',
        password: await bcrypt.hash(regularPassword, saltRounds),
        role: 'user'
      });
       regularUser.password = regularPassword; // Attach plain password for login tests

      adminUser = await db.User.create({
        fullName: 'Admin User',
        birthDate: '1990-01-01',
        email: 'admin@example.com',
        password: await bcrypt.hash(adminPassword, saltRounds),
        role: 'admin'
      });

      regularToken = generateToken(regularUser);
      adminToken = generateToken(adminUser);
    });

    describe('GET /api/users', () => {
      it('should be forbidden for regular users', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${regularToken}`);
        expect(response.status).toBe(403);
      });

      it('should return all users for an admin', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.users).toBeInstanceOf(Array);
        // We created 2 users directly, plus the login user and potentially others
        expect(response.body.users.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should allow a user to get their own profile', async () => {
        const response = await request(app)
          .get(`/api/users/${regularUser.id}`)
          .set('Authorization', `Bearer ${regularToken}`);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(regularUser.id);
      });

      it('should forbid a user from getting another user\'s profile', async () => {
        const response = await request(app)
          .get(`/api/users/${adminUser.id}`)
          .set('Authorization', `Bearer ${regularToken}`);
        expect(response.status).toBe(403);
      });

      it('should allow an admin to get any user\'s profile', async () => {
        const response = await request(app)
          .get(`/api/users/${regularUser.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(regularUser.id);
      });
    });

    describe('PATCH /api/users/:id/block', () => {
      it('should forbid a user from blocking another user', async () => {
        const response = await request(app)
          .patch(`/api/users/${adminUser.id}/block`)
          .set('Authorization', `Bearer ${regularToken}`);
        expect(response.status).toBe(403);
      });

      it('should allow an admin to block a user', async () => {
        const response = await request(app)
          .patch(`/api/users/${regularUser.id}/block`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.isBlocked).toBe(true);
      });

      it('a blocked user should not be able to log in', async () => {
        // regularUser is now blocked from the previous test
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: regularUser.email, password: regularUser.password });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication failed: User is blocked.');
      });
    });
  });
});

