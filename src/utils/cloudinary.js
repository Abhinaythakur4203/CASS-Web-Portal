import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
import { ApiError } from "./apiError.js";

// Configure environment variables
dotenv.config({
    path: "./.env"
});

// Cloudinary Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Extracts the public ID from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID for the resource
 */
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    // Extract the filename without extension from the URL
    const urlParts = url.split('/');
    const fileNameWithExtension = urlParts.pop();
    return fileNameWithExtension.split('.')[0];
};

/**
 * Uploads a file to Cloudinary
 * @param {string} localFilePath - Path to the file on local storage
 * @returns {Object|null} - Object containing URL or null if upload fails
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload to Cloudinary
        const res = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });

        // Delete the local file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return { url: res.secure_url };
    } 
    catch (error) {
        console.error("Cloudinary Upload Error:", error);

        // Remove local temp file only if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null; // Return null to handle errors properly
    }
};

/**
 * Deletes a file from Cloudinary
 * @param {string} mediaUrl - Cloudinary URL of the file to delete
 * @throws {ApiError} - If deletion fails or URL is not provided
 */
const deleteFromCloudinary = async (mediaUrl) => {
    try {
        if (!mediaUrl) {
            throw new ApiError(400, "No media URL provided for deletion");
        }

        const publicId = getPublicIdFromUrl(mediaUrl);
        
        if (!publicId) {
            throw new ApiError(400, "Could not extract public ID from media URL");
        }

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        throw new ApiError(500, "Error deleting media from Cloudinary");
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
