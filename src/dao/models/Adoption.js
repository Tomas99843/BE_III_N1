import mongoose from 'mongoose';

const collection = 'Adoptions';

const schema = new mongoose.Schema({
    owner: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Users',
        required: [true, 'El dueño es requerido'],
        index: true
    },
    pet: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Pets',
        required: [true, 'La mascota es requerida'],
        index: true,
        unique: true 
    },
    adoptionDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    adoptionFee: {
        type: Number,
        min: [0, 'La tarifa de adopción no puede ser negativa']
    }
}, {
    timestamps: true
});


schema.index({ owner: 1, status: 1 });
schema.index({ status: 1, adoptionDate: -1 });


schema.pre('save', async function(next) {
    try {
        const Pet = mongoose.model('Pets');
        const pet = await Pet.findById(this.pet);
        
        if (!pet) {
            return next(new Error('La mascota no existe'));
        }
        
        if (pet.adopted) {
            return next(new Error('Esta mascota ya ha sido adoptada'));
        }
        
        
        pet.adopted = true;
        pet.status = 'adopted';
        pet.owner = this.owner;
        await pet.save();
        
        next();
    } catch (error) {
        next(error);
    }
});


schema.pre('remove', async function(next) {
    try {
        const Pet = mongoose.model('Pets');
        await Pet.findByIdAndUpdate(this.pet, {
            $set: { adopted: false, status: 'available' },
            $unset: { owner: 1 }
        });
        next();
    } catch (error) {
        next(error);
    }
});

const adoptionModel = mongoose.model(collection, schema);

export default adoptionModel;