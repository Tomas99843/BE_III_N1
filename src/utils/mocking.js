import { faker } from '@faker-js/faker';

export function crearMascotaFalsa() {
  const especies = ['perro', 'gato', 'conejo', 'pájaro', 'hamster'];
  const especieAleatoria = especies[Math.floor(Math.random() * especies.length)];
  
  const mascota = {
    name: faker.person.firstName(),
    specie: especieAleatoria,
    adopted: false,
    birthDate: faker.date.past({ years: 10 }),
    image: faker.image.urlLoremFlickr({ category: 'animals' })
  };
  
  return mascota;
}

export function generarMascotasMock(cantidad = 100) {
  console.log(`Generando ${cantidad} mascotas mock...`);
  
  const mascotas = [];
  
  for (let i = 0; i < cantidad; i++) {
    mascotas.push(crearMascotaFalsa());
  }
  
  console.log(`${mascotas.length} mascotas generadas`);
  return mascotas;
}