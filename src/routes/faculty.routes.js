import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addFacultyMember,
  deleteFacultyMember,
  getAllFaculties,
  updateFacultyMember,
} from "../controllers/faculty.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import csrf from 'csurf';

const router = Router();
const csrfProtection = csrf({ cookie: true });

// Get all faculty members (head and member)
router.route("/").get(getAllFaculties);

// Add a new faculty member (head or member)
router.route("/add").post(csrfProtection, verifyJWT, upload.single('image'), addFacultyMember);

// Update a faculty member (head or member)
router
  .route("/update/:type/:id")
  .patch(csrfProtection, verifyJWT, upload.single('image'), updateFacultyMember);

// Delete a faculty member (head or member)
router.route("/delete/:type/:id").delete(csrfProtection, verifyJWT, deleteFacultyMember);

export default router;
