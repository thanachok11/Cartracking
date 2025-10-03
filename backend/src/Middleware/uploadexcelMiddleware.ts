import multer from "multer";

// ใช้ memoryStorage → ไม่เก็บไฟล์ลงเครื่อง
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.mimetype === "application/vnd.ms-excel"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only Excel files are allowed!"));
        }
    },
});

export default upload;
