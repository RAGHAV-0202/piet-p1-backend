import multer from "multer";

const storage = multer.memoryStorage(); // Use memory storage for buffer upload
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (5MB)
});


export default upload;
