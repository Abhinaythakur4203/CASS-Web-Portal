import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Gallery } from '../models/gallery.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { checkUserRole } from '../middleware/auth.middleware.js';
import validator from 'validator';
import { logSuspiciousActivity } from '../utils/logger.js';

// ✅ Create a New Gallery Bucket (With Multiple Images)
const createGallery = asyncHandler(async (req, res) => {
    try {
        checkUserRole(req); // Ensure only admin can create gallery
    } catch (error) {
        return res
        .status(error.statusCode || 500)
        .json(
            new ApiResponse(error.statusCode || 500, null, error.message)
        );
    }

    const { title, description } = req.body;
    if (!title || !req.files || req.files.length === 0) {
        logSuspiciousActivity(req, 'Missing title or images for gallery creation');
        throw new ApiError(400, "Title and at least one image are required!");
    }

    if (!validator.isLength(title, { min: 1, max: 100 }) ||
        (description && !validator.isLength(description, { min: 1, max: 500 }))) {
        logSuspiciousActivity(req, 'Invalid input data for gallery creation');
        throw new ApiError(400, "Invalid input data!");
    }

    let images = [];

    for (const file of req.files) {
        const uploadedImage = await uploadOnCloudinary(file.path);
        if (uploadedImage.url) {
            images.push({ imageUrl: uploadedImage.url });
        }
    }

    const gallery = await Gallery.create({ title, description, images });

    res
    .status(201)
    .json(
        new ApiResponse(201, gallery, "Gallery created successfully!")
    );
});

// ✅ Add Images to an Existing Gallery
const addImagesToGallery = asyncHandler(async (req, res) => {
    try {
        checkUserRole(req); // Ensure only admin can update gallery
    } catch (error) {
        return res
        .status(error.statusCode || 500)
        .json(new ApiResponse(error.statusCode || 500, null, error.message)
    );
    }

    const { id } = req.params;
    const gallery = await Gallery.findById(id);

    if (!gallery) {
        logSuspiciousActivity(req, 'Gallery not found');
        throw new ApiError(404, "Gallery not found!");
    }

    if (!req.files || req.files.length === 0) {
        logSuspiciousActivity(req, 'No images provided for adding to gallery');
        throw new ApiError(400, "At least one image is required!");
    }

    for (const file of req.files) {
        const uploadedImage = await uploadOnCloudinary(file.path);
        if (uploadedImage.url) {
            gallery.images.push({ imageUrl: uploadedImage.url });
        }
    }

    await gallery.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200, gallery, "Images added to gallery successfully!")
    );
});

// ✅ Get All Galleries
const getAllGalleries = asyncHandler(async (req, res) => {
    const galleries = await Gallery.find().sort({ createdAt: -1 });
    if (!galleries.length) throw new ApiError(404, "No galleries found!");

    return res
    .status(200)
    .json(
        new ApiResponse(200, galleries, "All galleries fetched successfully")
    );
});

// ✅ Get a Specific Gallery by ID
const getGalleryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const gallery = await Gallery.findById(id);
    if (!gallery) throw new ApiError(404, "Gallery not found!");

    return res
    .status(200)
    .json(
        new ApiResponse(200, gallery, "Gallery details fetched successfully")
    );
});

// ✅ Delete a Specific Image from a Gallery
const deleteImageFromGallery = asyncHandler(async (req, res) => {
    try {
        checkUserRole(req); // Ensure only admin can delete images
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }

    const { id, imageId } = req.params;
    const gallery = await Gallery.findById(id);
    
    if (!gallery) {
        logSuspiciousActivity(req, 'Gallery not found');
        throw new ApiError(404, "Gallery not found!");
    }

    const imageToDelete = gallery.images.find(img => img._id.toString() === imageId);

    if (!imageToDelete) {
        logSuspiciousActivity(req, 'Image not found in gallery');
        throw new ApiError(404, "Image not found in gallery!");
    }

    try {
        await deleteFromCloudinary(imageToDelete.imageUrl);
    } catch (error) {
        console.error("Failed to delete image from Cloudinary:", error);
    }

    gallery.images = gallery.images.filter(img => img._id.toString() !== imageId);
    await gallery.save();

    res.status(200).json(new ApiResponse(200, gallery, "Image deleted from gallery successfully"));
});

// ✅ Delete an Entire Gallery (Including All Images)
const deleteGallery = asyncHandler(async (req, res) => {
    try {
        checkUserRole(req); // Ensure only admin can delete gallery
    } catch (error) {
        return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, null, error.message));
    }

    const { id } = req.params;
    const gallery = await Gallery.findById(id);
    if (!gallery) {
        logSuspiciousActivity(req, 'Gallery not found');
        throw new ApiError(404, "Gallery not found!");
    }

    try {
        for (const image of gallery.images) {
            await deleteFromCloudinary(image.imageUrl);
        }
    } catch (error) {
        console.error("Failed to delete images from Cloudinary:", error);
    }

    await Gallery.findByIdAndDelete(id);

    res.status(200).json(new ApiResponse(200, {}, "Gallery deleted successfully"));
});

export { 
    createGallery, 
    addImagesToGallery, 
    getAllGalleries, 
    getGalleryById, 
    deleteImageFromGallery, 
    deleteGallery 
};
