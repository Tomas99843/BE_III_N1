
import UserModel from './models/User.js';

export default class UsersDAO {
    constructor() {
        this.model = UserModel;
    }

    
    create = async (userData) => {
        try {
            const user = new this.model(userData);
            return await user.save();
        } catch (error) {
            throw error;
        }
    }

    D
    get = async (id) => {
        try {
            return await this.model.findById(id)
                .select('-password -failedLoginAttempts -lockUntil -__v')
                .populate('pets._id', 'name specie age');
        } catch (error) {
            throw error;
        }
    }

    
    getBy = async (query) => {
        try {
            return await this.model.findOne(query)
                .select('-password -failedLoginAttempts -lockUntil -__v');
        } catch (error) {
            throw error;
        }
    }

    
    getAll = async (query = {}, options = {}) => {
        try {
            const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
            
            return await this.model.find(query)
                .select('-password -failedLoginAttempts -lockUntil -__v')
                .skip(skip)
                .limit(limit)
                .sort(sort);
        } catch (error) {
            throw error;
        }
    }

    
    update = async (id, updateData) => {
        try {
            return await this.model.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password -failedLoginAttempts -lockUntil -__v');
        } catch (error) {
            throw error;
        }
    }

    
    delete = async (id) => {
        try {
            return await this.model.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }

    
    deleteMany = async (query) => {
        try {
            return await this.model.deleteMany(query);
        } catch (error) {
            throw error;
        }
    }

    
    count = async (query = {}) => {
        try {
            return await this.model.countDocuments(query);
        } catch (error) {
            throw error;
        }
    }

    
    aggregate = async (pipeline) => {
        try {
            return await this.model.aggregate(pipeline);
        } catch (error) {
            throw error;
        }
    }

    
    getWithPassword = async (email) => {
        try {
            return await this.model.findOne({ email })
                .select('+password +failedLoginAttempts +lockUntil');
        } catch (error) {
            throw error;
        }
    }

    
    addDocument = async (userId, document) => {
        try {
            return await this.model.findByIdAndUpdate(
                userId,
                { $push: { documents: document } },
                { new: true, runValidators: true }
            ).select('documents');
        } catch (error) {
            throw error;
        }
    }

    
    updateLastConnection = async (userId) => {
        try {
            return await this.model.findByIdAndUpdate(
                userId,
                { last_connection: new Date() },
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    }
}