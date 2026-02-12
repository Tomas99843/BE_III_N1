export default class PetDTO {
    static getPetInputFrom = (pet) => ({
        name: pet.name || '',
        specie: pet.specie || '',
        image: pet.image || '',
        birthDate: pet.birthDate || new Date('2000-12-30'),
        adopted: false,
        status: 'available'
    })

    static getPetOutputFrom = (pet) => ({
        id: pet._id,
        name: pet.name,
        specie: pet.specie,
        breed: pet.breed || '',
        age: pet.age || this.calculateAge(pet.birthDate),
        birthDate: pet.birthDate,
        adopted: pet.adopted || false,
        status: pet.status || 'available',
        image: pet.image,
        owner: pet.owner,
        location: pet.location || {},
        description: pet.description || '',
        created_at: pet.createdAt,
        updated_at: pet.updatedAt
    })

    static calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const diff = Date.now() - new Date(birthDate).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    static getPetForAdoption = (pet) => ({
        id: pet._id,
        name: pet.name,
        specie: pet.specie,
        age: this.calculateAge(pet.birthDate),
        image: pet.image,
        location: pet.location || {},
        description: pet.description || ''
    })
}