import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
})

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import helmet from 'helmet';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    
}));

app.use(helmet());
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true,limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Routes
import adminRouters from  "../src/routes/admin.routes.js";
import eventsRouters from '../src/routes/event.routes.js';
import facultyRouters from '../src/routes/faculty.routes.js';
import galleryRouters from '../src/routes/gallery.routes.js';
import feedbackRouters from '../src/routes/feedback.routes.js';
import newsletterRouters from '../src/routes/newsletter.routes.js';

app.use('/api/v1/admin', adminRouters);
app.use('/api/v1/Events', eventsRouters);
app.use('/api/v1/Faculty', facultyRouters);
app.use('/api/v1/Gallery', galleryRouters);
app.use('/api/v1/Feedback', feedbackRouters);
app.use('/api/v1/Newsletter', newsletterRouters);

app.use((req, res, next) => {
    res.cookie('XSRF-TOKEN', req.csrfToken(), { secure: true, httpOnly: true });
    next();
});

export  {app }
