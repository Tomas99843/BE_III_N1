import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Importar app dinámicamente después de configurar MongoDB
let app;

describe('Adoption API - Functional Tests (REQUIRED FOR SUBMISSION)', () => {
    let mongoServer;
    let agent;
    let testUserId;
    let testPetId;
    let userToken;

    before(async () => {
        // 1. Iniciar MongoDB en memoria
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // 2. Conectar mongoose
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB en memoria iniciado para tests');
        
        // 3. IMPORTAR Y REGISTRAR MODELOS
        const UserModule = await import('../src/dao/models/User.js');
        const PetModule = await import('../src/dao/models/Pet.js');
        const AdoptionModule = await import('../src/dao/models/Adoption.js');
        
        mongoose.model('User', UserModule.default.schema);
        mongoose.model('Pet', PetModule.default.schema);
        mongoose.model('Adoption', AdoptionModule.default.schema);
        
        // 4. Importar app
        const appModule = await import('../src/app.js');
        app = appModule.default;
        
        agent = request.agent(app);
    });

    after(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        console.log('✅ MongoDB en memoria detenido');
    });

    beforeEach(async () => {
        // Limpiar colecciones
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }

        // Crear usuario de prueba usando API
        const userResponse = await agent
            .post('/api/sessions/register')
            .send({
                first_name: 'Test',
                last_name: 'User',
                email: 'test@test.com',
                password: 'password123'
            })
            .expect(200);

        testUserId = userResponse.body.user.id;
        // Obtener cookie correctamente
        userToken = userResponse.headers['set-cookie'][0];

        // Crear mascota directamente en DB
        const Pet = mongoose.model('Pet');
        const testPet = new Pet({
            name: 'TestPet',
            specie: 'perro',
            breed: 'Mixed',
            age: 2,
            adopted: false,
            status: 'available'
        });
        await testPet.save();
        testPetId = testPet._id.toString();
    });

    describe('Health Check Endpoints', () => {
        it('GET /health should return 200', async () => {
            const response = await agent
                .get('/health')
                .expect(200);

            expect(response.body).to.have.property('status', 'OK');
        });

        it('GET /api-docs should return 200', async () => {
            await agent
                .get('/api-docs')
                .expect(200);
        });
    });

    describe('Adoption Creation', () => {
        it('POST /api/adoptions/user/:uid/pet/:pid should create adoption (201)', async () => {
            const response = await agent
                .post(`/api/adoptions/user/${testUserId}/pet/${testPetId}`)
                .set('Cookie', userToken)
                .send({
                    notes: 'Test adoption'
                })
                .expect(201);

            expect(response.body).to.have.property('status', 'success');
            expect(response.body.data).to.have.property('status', 'pending');
        });

        it('POST should fail for already adopted pet (400)', async () => {
            // Marcar mascota como adoptada
            const Pet = mongoose.model('Pet');
            await Pet.findByIdAndUpdate(testPetId, { adopted: true, status: 'adopted' });

            await agent
                .post(`/api/adoptions/user/${testUserId}/pet/${testPetId}`)
                .set('Cookie', userToken)
                .expect(400);
        });
    });

    describe('Adoption Retrieval', () => {
        it('GET /api/adoptions should return list with auth (200)', async () => {
            // Primero crear una adopción
            const Adoption = mongoose.model('Adoption');
            const adoption = new Adoption({
                owner: testUserId,
                pet: testPetId,
                status: 'pending'
            });
            await adoption.save();

            const response = await agent
                .get('/api/adoptions')
                .set('Cookie', userToken)
                .expect(200);

            expect(response.body).to.have.property('status', 'success');
            expect(response.body.data).to.be.an('array');
        });

        it('GET /api/adoptions should return 401 without auth', async () => {
            await agent
                .get('/api/adoptions')
                .expect(401);
        });

        it('GET /api/adoptions/:id should return specific adoption (200)', async () => {
            // Crear adopción
            const Adoption = mongoose.model('Adoption');
            const adoption = new Adoption({
                owner: testUserId,
                pet: testPetId,
                status: 'pending'
            });
            await adoption.save();
            const adoptionId = adoption._id.toString();

            const response = await agent
                .get(`/api/adoptions/${adoptionId}`)
                .set('Cookie', userToken)
                .expect(200);

            expect(response.body.data).to.have.property('_id', adoptionId);
        });
    });

    describe('User Adoptions', () => {
        it('GET /api/adoptions/user/:uid should return user adoptions (200)', async () => {
            // Crear adopción para el usuario
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
                .expect(200);

            expect(response.body.data).to.be.an('array');
            expect(response.body.data[0].owner._id).to.equal(testUserId);
        });
    });

    describe('Adoption Update', () => {
        let adoptionId;

        beforeEach(async () => {
            // Crear adopción antes de cada test de update
            const Adoption = mongoose.model('Adoption');
            const adoption = new Adoption({
                owner: testUserId,
                pet: testPetId,
                status: 'pending',
                notes: 'Initial notes'
            });
            await adoption.save();
            adoptionId = adoption._id.toString();
        });

        it('PUT /api/adoptions/:id should update notes (200)', async () => {
            const response = await agent
                .put(`/api/adoptions/${adoptionId}`)
                .set('Cookie', userToken)
                .send({
                    notes: 'Updated notes'
                })
                .expect(200);

            expect(response.body.data).to.have.property('notes', 'Updated notes');
        });

        it('PUT should return 403 for non-admin changing status', async () => {
            await agent
                .put(`/api/adoptions/${adoptionId}`)
                .set('Cookie', userToken)
                .send({
                    status: 'approved'
                })
                .expect(403);
        });
    });

    console.log('✅ Todos los tests funcionales básicos implementados para adoption.router.js');
});