import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

export class MockingModule {
    // Generar usuarios mock
    static async generateMockUsers(count = 50) {
        const users = [];
        const hashedPassword = await bcrypt.hash('coder123', 10); // Encriptar una vez

        for (let i = 0; i < count; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            
            users.push({
                first_name: firstName,
                last_name: lastName,
                email: faker.internet.email({ firstName, lastName }),
                age: faker.number.int({ min: 18, max: 80 }),
                password: hashedPassword,
                role: faker.helpers.arrayElement(['user', 'admin']),
                pets: [],
                createdAt: faker.date.recent({ days: 30 }),
                updatedAt: faker.date.recent({ days: 7 })
            });
        }
        
        return users;
    }

    // Generar mascotas mock (ya lo tienes en mockingpets)
    static generateMockPets(count = 50) {
        const pets = [];
        
        for (let i = 0; i < count; i++) {
            pets.push({
                name: faker.animal.dog(),
                specie: 'dog',
                birthDate: faker.date.past({ years: 10 }),
                adopted: false,
                owner: null,
                image: faker.image.urlLoremFlickr({ category: 'animals' }),
                createdAt: faker.date.recent({ days: 30 }),
                updatedAt: faker.date.recent({ days: 7 })
            });
        }
        
        return pets;
    }
}