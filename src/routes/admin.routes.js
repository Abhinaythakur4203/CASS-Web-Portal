import { Router } from 'express';
import {
    changeCurrentPassword,
    loginAdmin,
    logoutAdmin,
    refreshAccessToken,
    registerAdmin,
    validateToken
} from '../controllers/user.controllers.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js'; // Assuming you have a multer middleware for file uploads
import csrf from 'csurf';

const router = Router();
const csrfProtection = csrf({ cookie: true });

router.route("/registerAdmin").post(csrfProtection, upload.single("avatar"), registerAdmin);
router.route("/login").post(csrfProtection, loginAdmin);
router.route("/logout").post(csrfProtection, verifyJWT, logoutAdmin);
router.route("/refresh-token").post(csrfProtection, refreshAccessToken);
router.route("/change-password").post(csrfProtection, verifyJWT, changeCurrentPassword);
router.route("/validate-token").get(csrfProtection, verifyJWT, validateToken);

export default router;
