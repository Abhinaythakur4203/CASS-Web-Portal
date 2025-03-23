import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Faculty } from '../models/faculty.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

const checkAdmin = (req) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access denied! Admins only.");
    }
};

const deleteFromCloudinary = async (mediaUrl) => {
    if (!mediaUrl) return;
    const publicId = mediaUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);
};

// Create or add a new faculty member (head or member)
const addFacultyMember = asyncHandler(async (req, res) => {
    checkAdmin(req);

    const { type, name, designation, department, email, testimonial } = req.body;
    const localMediaPath = req.file?.path;

    if (!type || (type !== "head" && type !== "member")) {
        throw new ApiError(400, "Invalid type. Must be 'head' or 'member'.");
    }

    if (!name || !designation || !department || !email || !localMediaPath) {
        throw new ApiError(400, "All fields and media file are required!");
    }

    const image = await uploadOnCloudinary(localMediaPath);
    if (!image.url) {
        throw new ApiError(500, "Error uploading image to Cloudinary");
    }

    const faculty = await Faculty.findOne() || new Faculty({ head: [], member: [] });
    faculty[type].push({ name, designation, department, email, testimonial, image: image.url });
    await faculty.save();

    return res.status(201).json(new ApiResponse(201, { faculty }, "Faculty member added successfully!"));
});

// Get all faculty members
const getAllFaculties = asyncHandler(async (req, res) => {
    const faculty = await Faculty.findOne();
    if (!faculty) {
        throw new ApiError(404, "No faculty data found");
    }

    return res.status(200).json(new ApiResponse(200, { faculty }, "Faculty data retrieved successfully!"));
});

// Update a faculty member (head or member)
const updateFacultyMember = asyncHandler(async (req, res) => {
    checkAdmin(req);

    const { type, id } = req.params;
    const { name, designation, department, email, testimonial } = req.body;
    const localMediaPath = req.file?.path;

    if (!type || (type !== "head" && type !== "member")) {
        throw new ApiError(400, "Invalid type. Must be 'head' or 'member'.");
    }

    const faculty = await Faculty.findOne();
    if (!faculty) {
        throw new ApiError(404, "Faculty data not found");
    }

    const member = faculty[type].find((member) => member._id.toString() === id);
    if (!member) {
        throw new ApiError(404, "Faculty member not found");
    }

    const oldImage = member.image;
    let image;

    if (localMediaPath) {
        image = await uploadOnCloudinary(localMediaPath);
        if (!image.url) {
            throw new ApiError(500, "Error uploading image to Cloudinary");
        }
    }

    // Update fields
    member.name = name || member.name;
    member.designation = designation || member.designation;
    member.department = department || member.department;
    member.email = email || member.email;
    member.testimonial = testimonial || member.testimonial;
    member.image = image?.url || member.image;

    await faculty.save();

    if (localMediaPath) {
        await deleteFromCloudinary(oldImage);
    }

    return res.status(200).json(new ApiResponse(200, { faculty }, "Faculty member updated successfully!"));
});

// Delete a faculty member (head or member)
const deleteFacultyMember = asyncHandler(async (req, res) => {
    checkAdmin(req);

    const { type, id } = req.params;

    if (!type || (type !== "head" && type !== "member")) {
        throw new ApiError(400, "Invalid type. Must be 'head' or 'member'.");
    }

    const faculty = await Faculty.findOne();
    if (!faculty) {
        throw new ApiError(404, "Faculty data not found");
    }

    const memberIndex = faculty[type].findIndex((member) => member._id.toString() === id);
    if (memberIndex === -1) {
        throw new ApiError(404, "Faculty member not found");
    }

    const [removedMember] = faculty[type].splice(memberIndex, 1);
    await faculty.save();

    if (removedMember.image) {
        await deleteFromCloudinary(removedMember.image);
    }

    return res.status(200).json(new ApiResponse(200, { faculty }, "Faculty member deleted successfully!"));
});

export {
    addFacultyMember,
    getAllFaculties,
    updateFacultyMember,
    deleteFacultyMember
};
