import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';

describe('Adoption API - Functional Tests (COMPLETE)', () => {
    let mongoServer;
    let agent;
    let testUserId;
    let testPetId;
    let testAdoptionId;
    let adminToken;
    let userToken;

    before(async () => {
        
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB en memoria iniciado para tests de adopción');
        agent = request.agent(app);
    });

    after(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        console.log('✅ MongoDB en memoria detenido');
    });

    beforeEach(async () => {
        
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }

        
        const userResponse = await agent
            .post('/api/sessions/register')
            .send({
                first_name: 'Juan',
                last_name: 'Pérez',
                email: 'juan.adopcion@test.com',
                password: 'SecurePass123!'
            })
            .expect(200);

        testUserId = userResponse.body.user.id;
        userToken = userResponse.headers['set-cookie'];

        
        const adminResponse = await agent
            .post('/api/sessions/register')
            .send({
                first_name: 'Admin',
                last_name: 'Sistema',
                email: 'admin@test.com',
                password: 'AdminPass123!'
            })
            .expect(200);

        
        const User = mongoose.model('User');
        await User.findOneAndUpdate(
            { email: 'admin@test.com' },
            { role: 'admin' }
        );

        
        await agent
            .post('/api/sessions/login')
            .send({
                email: 'admin@test.com',
                password: 'AdminPass123!'
            })
            .expect(200);

        adminToken = userResponse.headers['set-cookie'];

        
        const Pet = mongoose.model('Pet');
        const testPet = new Pet({
            name: 'Firulais',
            specie: 'perro',
            breed: 'Labrador',
            age: 3,
            adopted: false,
            status: 'available'
        });
        await testPet.save();
        testPetId = testPet._id.toString();
    });

    describe('GET /api/adoptions', () => {
        it('should get all adoptions with pagination (status 200)', async () => {
            const response = await agent
                .get('/api/adoptions')
                .set('Cookie', userToken)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).to.have.property('status', 'success');
            expect(response.body).to.have.property('data');
            expect(response.body.data).to.be.an('array');
            expect(response.body).to.have.property('pagination');
        });

        it('should filter adoptions by status', async () => {
            
            const Adoption = mongoose.model('Adoption');
            const adoption = new Adoption({
                owner: testUserId,
                pet: testPetId,
                status: 'pending'
            });
            await adoption.save();

            const response = await agent
                .get('/api/adoptions?status=pending')
                .set('Cookie', userToken)
                .expect(200);

            expect(response.body.data).to.be.an('array');
            expect(response.body.data[0]).to.have.property('status', 'pending');
        });

        it('should return 401 without authentication', async () => {
            await agent
                .get('/api/adoptions')
                .expect(401);
        });
    });

    describe('GET /api/adoptions/:aid', () => {
        it('should get a specific adoption by ID (status 200)', async () => {
            
            const Adoption = mongoose.model('Adoption');
            const adoption = new Adoption({
                owner: testUserId,
                pet: testPetId,
                status: 'pending'
            });
            await adoption.save();
            testAdoptionId = adoption._id.toString();

            const response = await agent
                .get(`/api/adoptions/${testAdoptionId}`)
                .set('Cookie', userToken)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).to.have.property('status', 'success');
            expect(response.body.data).to.have.property('_id', testAdoptionId);
        });

        it('should return 404 for non-existent adoption ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            
            await agent
                .get(`/api/adoptions/${nonExistentId}`)
                .set('Cookie', userToken)
                .expect(404);
        });

        it('should return 400 for invalid adoption ID format', async () => {
            await agent
                .get('/api/adoptions/invalid-id-format')
                .set('Cookie', userToken)
                .expect(400);
        });
    });

    describe('POST /api/adoptions/user/:uid/pet/:pid', () => {
        it('should create an adoption successfully (status 201)', async () => {
            const response = await agent
                .post(`/api/adoptions/user/${testUserId}/pet/${testPetId}`)
                .set('Cookie', userToken)
                .send({
                    notes: 'Quiero adoptar esta mascota',
                    adoptionFee: 0
                })
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body).to.have.property('status', 'success');
            expect(response.body).to.have.property('message').that.includes('creada');
            expect(response.body.data).to.have.property('status', 'pending');
        });

        it('should fail when pet is already adopted (status 400)', async () => {
            
            const Pet = mongoose.model('Pet');
            await Pet.findByIdAndUpdate(testPetId, { adopted: true, status: 'adopted' });

            await agent
                .post(`/api/adoptions/user/${testUserId}/pet/${testPetId}`)
                .set('Cookie', userToken)
                .expect(400);
        });

        it('should return 403 when creating adoption for another user', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            
            await agent
                .post(`/api/adoptions/user/${otherUserId}/pet/${testPetId}`)
                .set('Cookie', userToken)
                .expect(403);
        });
    });

    
    describe('PUT /api/adoptions/:aid', () => {
        beforeEach(async () => {
            
            const Adoption = mongoose.model('Adoption');
            const adoption = new Adoption({
                owner: testUserId,
                pet: testPetId,
                status: 'pending',
                notes: 'Notas iniciales'
            });
            await adoption.save();
            testAdoptionId = adoption._id.toString();
        });

        it('should update adoption status (admin only) - status 200', async () => {
            
            await agent
                .post('/api/sessions/login')
                .send({
                    email: 'admin@test.com',
                    password: 'AdminPass123!'
                })
                .expect(200);

            const response = await agent
                .put(`/api/adoptions/${testAdoptionId}`)
                .send({
                    status: 'approved',
                    notes: 'Adopción aprobada'
                })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).to.have.property('status', 'success');
            expect(response.body.data).to.have.property('status', 'approved');
        });

        it('should update adoption notes (owner) - status 200', async () => {
            const response = await agent
                .put(`/api/adoptions/${testAdoptionId}`)
                .set('Cookie', userToken)
                .send({
                    notes: 'Nuevas notas de la adopción'
                })
                .expect(200);

            expect(response.body.data).to.have.property('notes', 'Nuevas notas de la adopción');
        });

        it('should return 403 when non-admin tries to approve adoption', async () => {
            await agent
                .put(`/api/adoptions/${testAdoptionId}`)
                .set('Cookie', userToken)
                .send({
                    status: 'approved'
                })
                .expect(403);
        });

        it('should return 400 for invalid status', async () => {
            await agent
                .put(`/api/adoptions/${testAdoptionId}`)
                .set('Cookie', userToken)
                .send({
                    status: 'invalid-status'
                })
                .expect(400);
        });
    });

    describe('DELETE /api/adoptions/:aid', () => {
        beforeEach(async () => {
            
            const Adoption = mongoose.model('Adoption');
            const adoption = new Adoption({
                owner: testUserId,
                pet: testPetId,
                status: 'pending'
            });
            await adoption.save();
            testAdoptionId = adoption._id.toString();
        });

        it('should delete adoption (admin only) - status 200', async () => {
            
            await agent
                .post('/api/sessions/login')
                .send({
                    email: 'admin@test.com',
                    password: 'AdminPass123!'
                })
                .expect(200);

            const response = await agent
                .delete(`/api/adoptions/${testAdoptionId}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).to.have.property('status', 'success');
            expect(response.body).to.have.property('message').that.includes('eliminada');
        });

        it('should return 403 when non-admin tries to delete', async () => {
            await agent
                .delete(`/api/adoptions/${testAdoptionId}`)
                .set('Cookie', userToken)
                .expect(403);
        });

        it('should return 404 for non-existent adoption ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            
            
            await agent
                .post('/api/sessions/login')
                .send({
                    email: 'admin@test.com',
                    password: 'AdminPass123!'
                })
                .expect(200);

            await agent
                .delete(`/api/adoptions/${nonExistentId}`)
                .expect(404);
        });
    });

    describe('GET /api/adoptions/user/:uid', () => {
        it('should get adoptions for specific user (status 200)', async () => {
            
            const Adoption = mongoose.model('Adoption');
            const adoption = new Adoption({
                owner: testUserId,
                pet: testPetId,
                status: 'pending'
            });
            await adoption.save();

            const response = await agent
                .get(`/api/adoptions/user/${testUserId}`)
                .set('Cookie', userToken)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).to.have.property('status', 'success');
            expect(response.body.data).to.be.an('array');
            expect(response.body.data[0]).to.have.property('owner');
        });

        it('should filter user adoptions by status', async () => {
            
            const Adoption = mongoose.model('Adoption');
            await Adoption.create([
                { owner: testUserId, pet: new mongoose.Types.ObjectId(), status: 'pending' },
                { owner: testUserId, pet: new mongoose.Types.ObjectId(), status: 'approved' }
            ]);

            const response = await agent
                .get(`/api/adoptions/user/${testUserId}?status=pending`)
                .set('Cookie', userToken)
                .expect(200);

            expect(response.body.data).to.have.lengthOf(1);
            expect(response.body.data[0]).to.have.property('status', 'pending');
        });

        it('should return 403 when trying to see other user adoptions', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            
            await agent
                .get(`/api/adoptions/user/${otherUserId}`)
                .set('Cookie', userToken)
                .expect(403);
        });

        it('should allow admin to see any user adoptions', async () => {
            
            await agent
                .post('/api/sessions/login')
                .send({
                    email: 'admin@test.com',
                    password: 'AdminPass123!'
                })
                .expect(200);

            const response = await agent
                .get(`/api/adoptions/user/${testUserId}`)
                .expect(200);

            expect(response.body).to.have.property('status', 'success');
        });
    });

    describe('Adoption Complete Flow Test', () => {
        it('should complete full adoption workflow', async () => {
            
            const createResponse = await agent
                .post(`/api/adoptions/user/${testUserId}/pet/${testPetId}`)
                .set('Cookie', userToken)
                .expect(201);

            const adoptionId = createResponse.body.data._id;

            
            const getAllResponse = await agent
                .get('/api/adoptions')
                .set('Cookie', userToken)
                .expect(200);
            
            expect(getAllResponse.body.data).to.have.lengthOf(1);

            
            const getOneResponse = await agent
                .get(`/api/adoptions/${adoptionId}`)
                .set('Cookie', userToken)
                .expect(200);
            
            expect(getOneResponse.body.data._id).to.equal(adoptionId);

            
            const getUserResponse = await agent
                .get(`/api/adoptions/user/${testUserId}`)
                .set('Cookie', userToken)
                .expect(200);
            
            expect(getUserResponse.body.data).to.have.lengthOf(1);

            
            await agent
                .post('/api/sessions/login')
                .send({
                    email: 'admin@test.com',
                    password: 'AdminPass123!'
                })
                .expect(200);

            
            const updateResponse = await agent
                .put(`/api/adoptions/${adoptionId}`)
                .send({ status: 'approved' })
                .expect(200);
            
            expect(updateResponse.body.data).to.have.property('status', 'approved');

            console.log('✅ Flujo completo de adopción testado exitosamente');
        });
    });
});