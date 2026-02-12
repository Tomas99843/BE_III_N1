import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

class MockGenerator {
    constructor() {
        this.encryptedPassword = null;
    }

    async initializePassword() {
        const salt = await bcrypt.genSalt(10);
        this.encryptedPassword = await bcrypt.hash('coder123', salt);
        return this.encryptedPassword;
    }

    async createMockUser() {
        if (!this.encryptedPassword) await this.initializePassword();
        
        return {
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            email: faker.internet.email().toLowerCase(),
            password: this.encryptedPassword,
            role: ['user', 'admin'][Math.floor(Math.random() * 2)],
            pets: []
        };
    }

    async generateMockUsers(count = 50) {
        console.log(`[MockGenerator] Generando ${count} usuarios mock...`);
        const users = await Promise.all(Array.from({ length: count }, () => this.createMockUser()));
        console.log(`[MockGenerator] ${users.length} usuarios generados`);
        return users;
    }

    createMockPet() {
        const especies = ['perro', 'gato', 'conejo', 'pájaro', 'hamster'];
        
        return {
            name: faker.person.firstName(),
            specie: especies[Math.floor(Math.random() * especies.length)],
            birthDate: faker.date.past({ years: 10 }),
            adopted: false,
            owner: null,
            image: faker.image.urlLoremFlickr({ category: 'animals' })
        };
    }

    generateMockPets(count = 100) {
        console.log(`[MockGenerator] Generando ${count} mascotas mock...`);
        const pets = Array.from({ length: count }, () => this.createMockPet());
        console.log(`[MockGenerator] ${pets.length} mascotas generadas`);
        return pets;
    }

    async generateMockData(usersCount = 0, petsCount = 0) {
        const [users, pets] = await Promise.all([
            usersCount > 0 ? this.generateMockUsers(usersCount) : [],
            petsCount > 0 ? this.generateMockPets(petsCount) : []
        ]);
        
        return { users, pets };
    }

    generateMongoFormatUsers(count = 50) {
        return this.generateMockUsers(count);
    }
}

export default MockGenerator;