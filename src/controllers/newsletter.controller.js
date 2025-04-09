import { Newsletter } from "../models/newsletter.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { checkUserRole } from "../middleware/auth.middleware.js";
import validator from 'validator';
import { logSuspiciousActivity } from '../utils/logger.js';

const createNewsletter = asyncHandler(async (req, res) => {
    checkUserRole(req);

    const { title, description, date } = req.body;
    const localMediaPath = req.file?.path;

    if (!title || !description || !date || !localMediaPath) {
        logSuspiciousActivity(req, 'Missing required fields for newsletter creation');
        throw new ApiError(400, "All fields and media file are required!");
    }

    if (!validator.isLength(title, { min: 1, max: 100 }) ||
        !validator.isLength(description, { min: 1, max: 500 }) ||
        !validator.isISO8601(date)) {
        logSuspiciousActivity(req, 'Invalid input data for newsletter creation');
        throw new ApiError(400, "Invalid input data!");
    }

    const media = await uploadOnCloudinary(localMediaPath);
    if (!media.url) {
        logSuspiciousActivity(req, 'Error while uploading media file');
        throw new ApiError(400, "Error while uploading media file!");
    }

    const newNewsletter = await Newsletter.create({
        title,
        description,
        date,
        media: media.url,
    });

    res
        .status(201)
        .json(new ApiResponse(201, newNewsletter, "Newsletter created successfully!"));
});

const getAllNewsletters = asyncHandler(async (req, res) => {
    const newsletters = await Newsletter.find().sort({ createdAt: -1 });
    if (!newsletters.length) {
        throw new ApiError(404, "No newsletters found!");
    }

    res
        .status(200)
        .json(new ApiResponse(200, newsletters, "All newsletters fetched successfully"));
});

const updateNewsletter = asyncHandler(async (req, res) => {
    checkUserRole(req);

    const { id } = req.params;
    const cleanedId = id.trim();

    if (!mongoose.Types.ObjectId.isValid(cleanedId)) {
        logSuspiciousActivity(req, 'Invalid newsletter ID format');
        throw new ApiError(400, "Invalid newsletter ID format!");
    }

    const newsletter = await Newsletter.findById(cleanedId);
    if (!newsletter) {
        logSuspiciousActivity(req, 'Newsletter not found');
        throw new ApiError(404, "Newsletter not found!");
    }

    const { title, description, date } = req.body;
    let media = newsletter.media;

    if (req.file?.path) {
        if (newsletter.media) {
            await deleteFromCloudinary(newsletter.media);
        }
        const uploadedMedia = await uploadOnCloudinary(req.file.path);
        media = uploadedMedia.url;
    }

    // Update only the provided fields
    newsletter.title = title || newsletter.title;
    newsletter.description = description || newsletter.description;
    newsletter.date = date || newsletter.date;
    newsletter.media = media;

    await newsletter.save();

    res
        .status(200)
        .json(new ApiResponse(200, newsletter, "Newsletter updated successfully!"));
});

const deleteNewsletter = asyncHandler(async (req, res) => {
    checkUserRole(req);

    const { id } = req.params;
    const cleanedId = id.trim();

    if (!mongoose.Types.ObjectId.isValid(cleanedId)) {
        logSuspiciousActivity(req, 'Invalid newsletter ID format');
        throw new ApiError(400, "Invalid newsletter ID format!");
    }

    const newsletter = await Newsletter.findById(cleanedId);
    if (!newsletter) {
        logSuspiciousActivity(req, 'Newsletter not found');
        throw new ApiError(404, "Newsletter not found!");
    }

    if (newsletter.media) {
        try {
            await deleteFromCloudinary(newsletter.media);
        } catch (error) {
            console.error("Failed to delete media from Cloudinary:", error);
        }
    }

    await Newsletter.findByIdAndDelete(cleanedId);

    res
        .status(200)
        .json(new ApiResponse(200, {}, "Newsletter deleted successfully!"));
});

export {
    createNewsletter,
    getAllNewsletters,
    updateNewsletter,
    deleteNewsletter,
};
