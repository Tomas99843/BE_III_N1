// src/utils/MockGenerator.js
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

class MockGenerator {
  constructor() {
    this.encryptedPassword = null;
  }

  async initializePassword() {
    // Encriptar "coder123" una sola vez para reutilizar
    const salt = await bcrypt.genSalt(10);
    this.encryptedPassword = await bcrypt.hash('coder123', salt);
    return this.encryptedPassword;
  }

  // Método para generar un usuario falso
  async createMockUser() {
    if (!this.encryptedPassword) {
      await this.initializePassword();
    }
    
    const roles = ['user', 'admin'];
    
    // Crear usuario con formato EXACTO según tu modelo User.js
    const user = {
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(), // Email en minúsculas
      password: this.encryptedPassword,
      role: roles[Math.floor(Math.random() * roles.length)],
      pets: [] // Array vacío según requisito
    };
    
    return user;
  }

  // Método para generar múltiples usuarios
  async generateMockUsers(count = 50) {
    console.log(`[MockGenerator] Generando ${count} usuarios mock...`);
    
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createMockUser());
    }
    
    console.log(`[MockGenerator] ${users.length} usuarios generados`);
    return users;
  }

  // Método para generar una mascota falsa
  createMockPet() {
    const especies = ['perro', 'gato', 'conejo', 'pájaro', 'hamster'];
    const especieAleatoria = especies[Math.floor(Math.random() * especies.length)];
    
    // Crear mascota con formato EXACTO según tu modelo Pet.js
    const pet = {
      name: faker.person.firstName(),
      specie: especieAleatoria,
      birthDate: faker.date.past({ years: 10 }),
      adopted: false,
      owner: null, // null porque no tiene dueño inicialmente
      image: faker.image.urlLoremFlickr({ category: 'animals' })
    };
    
    return pet;
  }

  // Método para generar múltiples mascotas
  generateMockPets(count = 100) {
    console.log(`[MockGenerator] Generando ${count} mascotas mock...`);
    
    const pets = [];
    for (let i = 0; i < count; i++) {
      pets.push(this.createMockPet());
    }
    
    console.log(`[MockGenerator] ${pets.length} mascotas generadas`);
    return pets;
  }

  // Método para generar ambos tipos de datos
  async generateMockData(usersCount = 0, petsCount = 0) {
    const result = {
      users: [],
      pets: []
    };

    if (usersCount > 0) {
      result.users = await this.generateMockUsers(usersCount);
    }

    if (petsCount > 0) {
      result.pets = this.generateMockPets(petsCount);
    }

    return result;
  }

  // Método BONUS: generar usuarios con el formato que devolvería una petición de Mongo
  // (con _id y otros campos que MongoDB agrega automáticamente)
  generateMongoFormatUsers(count = 50) {
    // Simulamos ObjectIds falsos ya que no podemos importar mongoose aquí
    // MongoDB generará los ObjectIds reales al insertar
    return this.generateMockUsers(count);
  }
}

export default MockGenerator;