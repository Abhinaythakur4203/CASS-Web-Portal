import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Protected route - only authenticated users with proper role can upload images
router.route('/image').post(verifyJWT, upload.single('image'), uploadImage);

export default router;
