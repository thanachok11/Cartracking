import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Container from '../models/Container';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || '';
const filePath = path.join(__dirname, 'Container.csv');

// Default createdBy user ID (replace with valid user ObjectId from your DB)
const DEFAULT_USER_ID = '687b01a548e719aa1d7939ee';

async function importContainers() {
    try {
        await mongoose.connect(mongoURI, {
            dbName: 'Cartracking',
        });
        console.log('MongoDB connected');

        const results: any[] = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                results.push({
                    containerNumber: data.containerNumber,
                    companyName: data.companyName,
                    containerSize: data.containerSize,
                    createdBy: data.createdBy || DEFAULT_USER_ID,
                });
            })
            .on('end', async () => {
                console.log('Total containers read:', results.length);
                if (results.length === 0) {
                    console.error('No data found in CSV or column names mismatch');
                    process.exit(1);
                }

                try {
                    await Container.insertMany(results);
                    console.log('Containers imported successfully!');
                    process.exit(0);
                } catch (error: any) {
                    console.error('Error importing containers:', error.message);
                    if (error.errors) {
                        console.error('Validation errors:', error.errors);
                    }
                    process.exit(1);
                }
            });
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

importContainers();
