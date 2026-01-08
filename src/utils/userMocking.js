import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

// Encriptar contraseña fija "coder123"
const encryptPassword = async () => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash('coder123', salt);
};

export async function crearUsuarioFalso() {
    const hashedPassword = await encryptPassword();
    const roles = ['user', 'admin'];
    
    return {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: roles[Math.floor(Math.random() * roles.length)],
        pets: [] // Array vacío como pide la consigna
    };
}

export async function generarUsuariosMock(cantidad = 50) {
    console.log(`Generando ${cantidad} usuarios mock...`);
    
    const usuarios = [];
    
    for (let i = 0; i < cantidad; i++) {
        usuarios.push(await crearUsuarioFalso());
    }
    
    console.log(`${usuarios.length} usuarios generados`);
    return usuarios;
}