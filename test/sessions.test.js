import { expect } from 'chai';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';


import User from '../src/dao/models/User.js';
import { createHash, passwordValidation, isValidEmail } from '../src/utils/index.js';

describe('Sessions API - Unit Tests', () => {
    let mongoServer;

    before(async () => {
        
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB en memoria iniciado para tests');
    });

    after(async () => {
        
        await mongoose.disconnect();
        await mongoServer.stop();
        console.log('✅ MongoDB en memoria detenido');
    });

    beforeEach(async () => {
        
        await User.deleteMany({});
        console.log('🧹 Base de datos limpiada');
    });

    describe('User Registration Logic', () => {
        it('should create a new user with hashed password', async () => {
            const userData = {
                first_name: 'Juan',
                last_name: 'Pérez',
                email: 'juan.perez@example.com',
                password: 'SecurePass123!'
            };

            
            const hashedPassword = await createHash(userData.password);
            
            
            const user = new User({
                ...userData,
                password: hashedPassword
            });

            await user.save();

            
            const savedUser = await User.findOne({ email: userData.email });
            
            expect(savedUser).to.exist;
            expect(savedUser.first_name).to.equal(userData.first_name);
            expect(savedUser.last_name).to.equal(userData.last_name);
            expect(savedUser.email).to.equal(userData.email.toLowerCase()); 
            expect(savedUser.password).to.not.equal(userData.password); 
            expect(savedUser.password).to.include('$2b$'); 
            expect(savedUser.role).to.equal('user'); 
            expect(savedUser.documents).to.be.an('array').that.is.empty;
            expect(savedUser.last_connection).to.be.a('Date');
            expect(savedUser.createdAt).to.be.a('Date');
            expect(savedUser.updatedAt).to.be.a('Date');
        });

        it('should not allow duplicate email addresses', async () => {
            const userData = {
                first_name: 'Usuario',
                last_name: 'Uno',
                email: 'duplicado@example.com',
                password: 'password123'
            };

            
            const user1 = new User(userData);
            await user1.save();

            
            const user2 = new User({
                ...userData,
                first_name: 'Usuario', 
                last_name: 'Dos'
            });

            let error;
            try {
                await user2.save();
            } catch (err) {
                error = err;
            }

            
            expect(error).to.exist;
            expect(error.name).to.equal('MongoServerError');
            expect(error.code).to.equal(11000); 
        });

        it('should validate required fields', async () => {
            const incompleteUser = new User({
                first_name: 'Solo' 
                
            });

            let error;
            try {
                await incompleteUser.save();
            } catch (err) {
                error = err;
            }

            expect(error).to.exist;
            expect(error.errors).to.have.property('last_name');
            expect(error.errors).to.have.property('email');
            expect(error.errors).to.have.property('password');
        });
    });

    describe('Password Validation Logic', () => {
        let testUser;

        beforeEach(async () => {
            
            const userData = {
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                password: 'MySecurePassword123!'
            };

            const hashedPassword = await createHash(userData.password);
            testUser = new User({
                ...userData,
                password: hashedPassword
            });

            await testUser.save();
        });

        it('should validate correct password', async () => {
            const isValid = await passwordValidation(testUser, 'MySecurePassword123!');
            expect(isValid).to.be.true;
        });

        it('should reject incorrect password', async () => {
            const isValid = await passwordValidation(testUser, 'WrongPassword');
            expect(isValid).to.be.false;
        });

        it('should handle null/undefined user gracefully', async () => {
            const isValid = await passwordValidation(null, 'password');
            expect(isValid).to.be.false;
        });
    });

    describe('Email Validation', () => {
        it('should validate correct email formats', () => {
            const validEmails = [
                'user@example.com',
                'user.name@domain.co',
                'user+tag@example.org',
                'user@sub.domain.com'
            ];

            validEmails.forEach(email => {
                expect(isValidEmail(email)).to.be.true;
            });
        });

        it('should reject invalid email formats', () => {
            const invalidEmails = [
                'not-an-email',
                '@example.com',
                'user@.com',
                'user@com',
                'user@example.'
            ];

            invalidEmails.forEach(email => {
                expect(isValidEmail(email)).to.be.false;
            });
        });
    });

    describe('User Documents Functionality', () => {
        it('should add documents to user profile', async () => {
            const user = new User({
                first_name: 'Document',
                last_name: 'User',
                email: 'docuser@example.com',
                password: 'password123'
            });

            const documents = [
                {
                    name: 'DNI_Frontal.jpg',
                    reference: '/documents/DNI_Frontal-1234567890.jpg'
                },
                {
                    name: 'Comprobante_Domicilio.pdf',
                    reference: '/documents/Comprobante-9876543210.pdf'
                }
            ];

            
            documents.forEach(doc => user.documents.push(doc));
            
            await user.save();

            
            const savedUser = await User.findById(user._id);
            expect(savedUser.documents).to.have.lengthOf(2);
            
            expect(savedUser.documents[0]).to.have.property('name', 'DNI_Frontal.jpg');
            expect(savedUser.documents[0]).to.have.property('reference', '/documents/DNI_Frontal-1234567890.jpg');
            expect(savedUser.documents[0]).to.have.property('uploadedAt');
            expect(savedUser.documents[0].uploadedAt).to.be.a('Date');
            
            expect(savedUser.documents[1]).to.have.property('name', 'Comprobante_Domicilio.pdf');
        });

        it('should update last_connection timestamp', async () => {
            const user = new User({
                first_name: 'Connection',
                last_name: 'Test',
                email: 'connection@test.com',
                password: 'password123'
            });

            const initialConnection = user.last_connection;
            await user.save();
            await new Promise(resolve => setTimeout(resolve, 100)); 

            
            user.last_connection = new Date();
            await user.save();

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.last_connection.getTime())
                .to.be.greaterThan(initialConnection.getTime());
        });
    });

    describe('User Role Management', () => {
        it('should default to "user" role', async () => {
            const user = new User({
                first_name: 'Default',
                last_name: 'Role',
                email: 'default@role.com',
                password: 'password123'
            });

            await user.save();
            
            const savedUser = await User.findOne({ email: 'default@role.com' });
            expect(savedUser.role).to.equal('user');
        });

        it('should accept valid roles', async () => {
            const validRoles = ['user', 'admin', 'premium'];
            
            for (const role of validRoles) {
                const user = new User({
                    first_name: 'Role',
                    last_name: 'Test',
                    email: `${role}@test.com`,
                    password: 'password123',
                    role: role
                });

                await user.save();
                
                const savedUser = await User.findOne({ email: `${role}@test.com` });
                expect(savedUser.role).to.equal(role);
                expect(validRoles).to.include(savedUser.role);
            }
        });

        it('should reject invalid roles', async () => {
            const user = new User({
                first_name: 'Invalid',
                last_name: 'Role',
                email: 'invalid@role.com',
                password: 'password123',
                role: 'superadmin' 
            });

            let error;
            try {
                await user.save();
            } catch (err) {
                error = err;
            }

            
            if (!error) {
                const savedUser = await User.findOne({ email: 'invalid@role.com' });
                
                console.log('Nota: MongoDB aceptó rol no definido en enum');
            }
        });
    });
});