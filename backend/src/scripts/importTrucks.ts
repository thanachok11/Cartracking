import fs from 'fs';
import path from 'path';
import connectDB from '../utils/database';
import TruckHead from '../models/TruckHead';
import TruckTail from '../models/TruckTail';
import User from '../models/User';

interface HeadData {
    licensePlate: string;
    companyName: string;
}

interface TailData {
    licensePlate: string;
}

const importHeads = async (): Promise<void> => {
    try {
        await connectDB();

        // หา admin user เพื่อใช้เป็น createdBy
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.error('Admin user not found. Please create an admin user first.');
            return;
        }

        const heads: HeadData[] = [];
        const csvFilePath = path.join(__dirname, 'Heads_fixed.csv');

        // อ่าน CSV file แบบง่าย
        const csvContent = fs.readFileSync(csvFilePath, 'utf8');
        const lines = csvContent.split('\n');
        
        // ข้าม header (บรรทัดแรก) และประมวลผลข้อมูล
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const [licensePlate, companyName] = line.split(',');
                if (licensePlate && companyName) {
                    heads.push({
                        licensePlate: licensePlate.trim(),
                        companyName: companyName.trim(),
                    });
                }
            }
        }

        console.log(`Found ${heads.length} heads to import.`);

        // ลบข้อมูลเก่าออกก่อน (optional)
        await TruckHead.deleteMany({});
        console.log('Existing truck heads deleted.');

        // Insert ข้อมูลใหม่
        const headsWithCreatedBy = heads.map(head => ({
            ...head,
            createdBy: adminUser._id,
        }));

        const result = await TruckHead.insertMany(headsWithCreatedBy);
        console.log(`Successfully imported ${result.length} truck heads.`);

    } catch (error) {
        console.error('Error importing heads:', error);
    }
};

const importTails = async (): Promise<void> => {
    try {
        await connectDB();

        // หา admin user เพื่อใช้เป็น createdBy
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.error('Admin user not found. Please create an admin user first.');
            return;
        }

        const tails: TailData[] = [];
        const csvFilePath = path.join(__dirname, 'Tails.csv');

        // อ่าน CSV file แบบง่าย
        const csvContent = fs.readFileSync(csvFilePath, 'utf8');
        const lines = csvContent.split('\n');
        
        // ข้าม header (บรรทัดแรก) และประมวลผลข้อมูล
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                tails.push({
                    licensePlate: line.trim(),
                });
            }
        }

        console.log(`Found ${tails.length} tails to import.`);

        // ลบข้อมูลเก่าออกก่อน (optional)
        await TruckTail.deleteMany({});
        console.log('Existing truck tails deleted.');

        // Insert ข้อมูลใหม่ (ใช้ companyName เป็นค่าเริ่มต้น)
        const tailsWithCreatedBy = tails.map(tail => ({
            ...tail,
            companyName: 'พอร์โชเอ็น', // ค่าเริ่มต้นสำหรับบริษัท
            createdBy: adminUser._id,
        }));

        const result = await TruckTail.insertMany(tailsWithCreatedBy);
        console.log(`Successfully imported ${result.length} truck tails.`);

    } catch (error) {
        console.error('Error importing tails:', error);
    }
};

// รัน import scripts
const runImport = async () => {
    try {
        console.log('Starting import process...');
        
        await importHeads();
        console.log('Heads import completed.');
        
        await importTails();
        console.log('Tails import completed.');
        
        console.log('All imports completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Import process failed:', error);
        process.exit(1);
    }
};

// เรียกใช้ script เมื่อไฟล์นี้ถูกรันโดยตรง
if (require.main === module) {
    runImport();
}

export { importHeads, importTails };
