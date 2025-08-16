import multer from 'multer';

// ใช้ memoryStorage เพื่อเก็บไฟล์ใน buffer
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;