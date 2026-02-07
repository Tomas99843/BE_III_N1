import express from 'express';
import MockGenerator from '../utils/MockGenerator.js';
import User from '../dao/models/User.js';
import Pet from '../dao/models/Pet.js';

const router = express.Router();
const mockGenerator = new MockGenerator();

// Endpoint GET /api/mocks/mockingpets
router.get('/mockingpets', (req, res) => {
    try {
        const count = parseInt(req.query.count) || 50;
        const mockPets = mockGenerator.generateMockPets(count);
        
        res.json({
            status: 'success',
            payload: mockPets,
            total: mockPets.length,
            message: `${count} mascotas mock generadas`
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error generando mascotas mock: ' + error.message
        });
    }
});

// Endpoint GET /api/mocks/mockingusers
router.get('/mockingusers', async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 50;
        const mockUsers = await mockGenerator.generateMockUsers(count);
        
        res.json({
            status: 'success',
            payload: mockUsers,
            total: mockUsers.length,
            message: `${count} usuarios mock generados`
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error generando usuarios mock: ' + error.message
        });
    }
});

// Endpoint POST /api/mocks/generateData
router.post('/generateData', async (req, res) => {
    try {
        const { users = 0, pets = 0 } = req.body;
        
        if (users <= 0 && pets <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Debe especificar al menos un valor mayor a 0 para users o pets'
            });
        }

        const results = {
            users: { inserted: 0, data: [] },
            pets: { inserted: 0, data: [] }
        };

        // Usar el MockGenerator para crear los datos
        const mockData = await mockGenerator.generateMockData(
            users > 0 ? users : 0,
            pets > 0 ? pets : 0
        );

        if (users > 0 && mockData.users.length > 0) {
            const insertedUsers = await User.insertMany(mockData.users);
            results.users.inserted = insertedUsers.length;
            results.users.data = insertedUsers;
        }

        if (pets > 0 && mockData.pets.length > 0) {
            const insertedPets = await Pet.insertMany(mockData.pets);
            results.pets.inserted = insertedPets.length;
            results.pets.data = insertedPets;
        }

        res.json({
            status: 'success',
            message: 'Datos mock insertados exitosamente',
            results,
            summary: {
                totalInserted: results.users.inserted + results.pets.inserted
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error insertando datos mock: ' + error.message
        });
    }
});

export default router;