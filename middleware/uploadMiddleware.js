import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 150 * 1024 },
});

const uploadMiddleware = upload.array('files', 10);

export default uploadMiddleware;