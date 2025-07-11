import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log(process.env.MONGODB_URI)
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
