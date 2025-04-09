import { Router } from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent
} from '../controllers/event.controller.js';

import { verifyJWT } from '../middleware/auth.middleware.js';
import {upload} from '../middleware/multer.middleware.js';
import csrf from 'csurf';

const router = Router();
const csrfProtection = csrf({ cookie: true });

// Public Routes
router.route('/').get(getAllEvents);
router.route('/:identifier').get(getEventById);

// Admin-Protected Routes
router.route('/create').post(csrfProtection, verifyJWT, upload.single('media'), createEvent);
router.route('/update/:id').patch(csrfProtection, verifyJWT, upload.single('media'), updateEvent);
router.route('/delete/:id').delete(csrfProtection, verifyJWT, deleteEvent);

export default router;
