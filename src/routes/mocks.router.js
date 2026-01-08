import express from 'express';
import { generarMascotasMock } from '../utils/mocking.js';
import { generarUsuariosMock } from '../utils/userMocking.js';
import User from '../dao/models/User.js';
import Pet from '../dao/models/Pet.js';

const router = express.Router();

// 1. Endpoint GET /mockingpets (movido desde el primer desafío)
router.get('/mockingpets', (req, res) => {
    try {
        const count = parseInt(req.query.count) || 50;
        const mockPets = generarMascotasMock(count);
        
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

// 2. Endpoint GET /mockingusers (nuevo - genera 50 usuarios mock)
router.get('/mockingusers', async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 50;
        const mockUsers = await generarUsuariosMock(count);
        
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

// 3. Endpoint POST /generateData (nuevo - inserta en DB)
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

        // Insertar usuarios si se solicitan
        if (users > 0) {
            const mockUsers = await generarUsuariosMock(users);
            const insertedUsers = await User.insertMany(mockUsers);
            results.users.inserted = insertedUsers.length;
            results.users.data = insertedUsers;
        }

        // Insertar mascotas si se solicitan
        if (pets > 0) {
            const mockPets = generarMascotasMock(pets);
            const insertedPets = await Pet.insertMany(mockPets);
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

// 4. Endpoint adicional: Limpiar datos mock (opcional)
router.delete('/cleanMockData', async (req, res) => {
    try {
        // Eliminar usuarios mock (podrías identificar por algún patrón)
        // En este caso eliminaría usuarios con password 'coder123'
        // Pero mejor usar un campo 'isMock' o similar
        
        res.json({
            status: 'success',
            message: 'Datos mock eliminados (implementación pendiente)'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error limpiando datos: ' + error.message
        });
    }
});

export default router;