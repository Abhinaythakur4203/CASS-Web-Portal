import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

import express from 'express';
import cors from 'cors';
import helmet from "helmet";
import cookieParser from 'cookie-parser';

const app = express();

// Safely handle CORS_ORIGIN environment variable
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];

app.use(helmet()); // Security middleware to set various HTTP headers
// Middleware to enforce HTTPS
app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https" && process.env.NODE_ENV === "production") {
        if (req.method === "GET" || req.method === "HEAD") {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        } else {
            return res.status(405).json({ 
                error: "HTTPS is required for this request in production environment." 
            });
        }
    }
    next();
});

// Single CORS configuration function for reuse
const corsOptions = {
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        
        // Create an array of allowed origin patterns
        const allowedOriginPatterns = corsOrigins.map(o => new RegExp(`^${o.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`));
        
        // Check if any pattern matches
        const isAllowed = allowedOriginPatterns.some(pattern => pattern.test(origin));
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: true,
    exposedHeaders: ['Authorization'],
    maxAge: 86400 // Cache preflight requests for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// CORS error handler
app.use((err, req, res, next) => {
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            error: 'CORS Error',
            message: err.message
        });
    }
    next(err);
});

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import adminRouters from "../src/routes/admin.routes.js";
import eventsRouters from '../src/routes/event.routes.js';
import facultyRouters from '../src/routes/faculty.routes.js';
import galleryRouters from '../src/routes/gallery.routes.js';
import feedbackRouters from '../src/routes/feedback.routes.js';
import newsletterRouters from '../src/routes/newsletter.routes.js';
import registerRouters from '../src/routes/register.routes.js';
import uploadRouters from '../src/routes/upload.routes.js';

app.use('/api/v1/admin', adminRouters);
app.use('/api/v1/Events', eventsRouters);
app.use('/api/v1/faculty', facultyRouters);
app.use('/api/v1/gallery', galleryRouters);
app.use('/api/v1/feedback', feedbackRouters);
app.use('/api/v1/newsletter', newsletterRouters);
app.use('/api/v1/register', registerRouters);
app.use('/api/v1/upload', uploadRouters);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to CASS Web Portal API',
    version: '1.0'
  });
});

export { app };