import { Router } from 'express';
import {
    addFeedback,
    getAllFeedback,
    deleteFeedback,
    deleteAllFeedback,
    getFeedbackByEvent
} from "../controllers/feedback.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import csrf from 'csurf';

const router = Router();
const csrfProtection = csrf({ cookie: true });

// Routes
router.route('/add/:eventId').post(csrfProtection, verifyJWT, addFeedback); // Add feedback (protected)
router.route('/').get(csrfProtection, verifyJWT, getAllFeedback)   // Get all feedback (protected)
router.route('/').delete(csrfProtection, verifyJWT, deleteAllFeedback); // Delete all feedback (protected)
router.route('/:id').delete(csrfProtection, verifyJWT, deleteFeedback); // Delete specific feedback by ID (protected)
router.route('/event/:eventId').get(csrfProtection, verifyJWT, getFeedbackByEvent); // Get feedback by event ID (protected)

export default router;
