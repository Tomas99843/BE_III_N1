import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

export class MockingModule {
    static async generateMockUsers(count = 50) {
        const hashedPassword = await bcrypt.hash('coder123', 10);
        return Array.from({ length: count }, () => {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            return {
                first_name: firstName,
                last_name: lastName,
                email: faker.internet.email({ firstName, lastName }),
                age: faker.number.int({ min: 18, max: 80 }),
                password: hashedPassword,
                role: faker.helpers.arrayElement(['user', 'admin']),
                pets: [],
                createdAt: faker.date.recent({ days: 30 }),
                updatedAt: faker.date.recent({ days: 7 })
            };
        });
    }

    static generateMockPets(count = 50) {
        return Array.from({ length: count }, () => ({
            name: faker.animal.dog(),
            specie: 'dog',
            birthDate: faker.date.past({ years: 10 }),
            adopted: false,
            owner: null,
            image: faker.image.urlLoremFlickr({ category: 'animals' }),
            createdAt: faker.date.recent({ days: 30 }),
            updatedAt: faker.date.recent({ days: 7 })
        }));
    }
}