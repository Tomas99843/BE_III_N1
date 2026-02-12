import mongoose from 'mongoose';

const collection = 'Pets';

const schema = new mongoose.Schema({
    name: { type: String, required: [true, 'El nombre de la mascota es requerido'], trim: true, minlength: [2, 'El nombre debe tener al menos 2 caracteres'], maxlength: [50, 'El nombre no puede exceder 50 caracteres'] },
    specie: { type: String, required: [true, 'La especie es requerida'], trim: true, enum: { values: ['perro', 'gato', 'conejo', 'ave', 'roedor', 'otro'], message: '{VALUE} no es una especie válida' } },
    breed: { type: String, trim: true, maxlength: [100, 'La raza no puede exceder 100 caracteres'] },
    age: { type: Number, min: [0, 'La edad no puede ser negativa'], max: [50, 'La edad no puede ser mayor a 50 años'] },
    birthDate: { type: Date, validate: { validator: v => v <= new Date(), message: 'La fecha de nacimiento no puede ser futura' } },
    adopted: { type: Boolean, default: false },
    owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users', index: true },
    image: { type: String, validate: { validator: v => !v || v.startsWith('http') || v.startsWith('/uploads/'), message: 'La imagen debe ser una URL válida o ruta de archivo' } },
    description: { type: String, maxlength: [500, 'La descripción no puede exceder 500 caracteres'] },
    status: { type: String, enum: ['available', 'adopted', 'reserved', 'pending'], default: 'available' },
    location: { city: String, state: String, country: String }
}, { timestamps: true });

schema.index({ specie: 1, adopted: 1 });
schema.index({ owner: 1, status: 1 });
schema.index({ status: 1, createdAt: -1 });

schema.virtual('ageYears').get(function() {
    if (!this.birthDate) return null;
    const diff = Date.now() - this.birthDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

const petModel = mongoose.model(collection, schema);
export default petModel;