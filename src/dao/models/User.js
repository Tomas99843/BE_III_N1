import mongoose from 'mongoose';

const collection = 'Users';

const schema = new mongoose.Schema({
    first_name: { type: String, required: [true, 'El nombre es requerido'], trim: true, minlength: [2, 'El nombre debe tener al menos 2 caracteres'], maxlength: [50, 'El nombre no puede exceder 50 caracteres'] },
    last_name: { type: String, required: [true, 'El apellido es requerido'], trim: true, minlength: [2, 'El apellido debe tener al menos 2 caracteres'], maxlength: [50, 'El apellido no puede exceder 50 caracteres'] },
    email: { type: String, required: [true, 'El email es requerido'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido'] },
    password: { type: String, required: [true, 'La contraseña es requerida'], select: false },
    role: { type: String, enum: ['user', 'admin', 'premium'], default: 'user' },
    pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pets' }],
    documents: [{
        name: { type: String, required: [true, 'El nombre del documento es requerido'] },
        reference: { type: String, required: [true, 'La referencia del documento es requerida'] },
        uploadedAt: { type: Date, default: Date.now }
    }],
    last_connection: { type: Date, default: Date.now },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false }
}, { timestamps: true });

schema.index({ email: 1 }, { unique: true });
schema.index({ role: 1 });
schema.index({ 'documents.name': 1 });

schema.virtual('full_name').get(function() {
    return `${this.first_name} ${this.last_name}`;
});

const userModel = mongoose.model(collection, schema);
export default userModel;