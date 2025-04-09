import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import validator from 'validator';
import rateLimit from 'express-rate-limit';
import { logSuspiciousActivity } from '../utils/logger.js';

const generateAccessTokenAndRefresToken = async (userId) => {
    try {
        const user = await Admin.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access token and refresh token");
    }
};

const registerAdmin = asyncHandler(async (req, res) => {
    const { username, password, email, phone, role } = req.body;
    const avatar = req.file?.path || null;

    if ([username, password, email, phone].some((field) => field?.trim() === "")) {
        logSuspiciousActivity(req, 'Missing required fields for registration');
        throw new ApiError(400, "All fields are required!");
    }

    if (!validator.isLength(username, { min: 1, max: 50 }) ||
        !validator.isEmail(email) ||
        !validator.isMobilePhone(phone, 'any', { strictMode: true })) {
        logSuspiciousActivity(req, 'Invalid input data for registration');
        throw new ApiError(400, "Invalid input data!");
    }

    const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
    const existingPhone = await Admin.findOne({ phone });

    if (existingPhone) {
        logSuspiciousActivity(req, 'User with this phone number already exists');
        throw new ApiError(409, "User with this phone number already exists!");
    }

    if (existingAdmin) {
        logSuspiciousActivity(req, 'User with username/email already exists');
        throw new ApiError(409, "User with username/email already exists!");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        logSuspiciousActivity(req, 'Password does not meet complexity requirements');
        throw new ApiError(400, "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character!");
    }

    let uploadAvatar = null;

    if (req.file) {
        try {
            uploadAvatar = await uploadOnCloudinary(req.file.path);

            if (!uploadAvatar.url) {
                logSuspiciousActivity(req, 'Error while uploading avatar');
                throw new ApiError(400, "Error while uploading avatar!");
            }
        } catch (error) {
            logSuspiciousActivity(req, 'Failed to upload avatar');
            throw new ApiError(500, "Failed to upload avatar!");
        }
    }

    const user = await Admin.create({
        username,
        password,
        email,
        phone,
        avatar: uploadAvatar?.url || null,
        role
    });

    const createdUser = await Admin.findById(user._id).select('-password');

    if (!createdUser) {
        logSuspiciousActivity(req, 'Failed to register user admin');
        throw new ApiError(500, "Failed to register user admin!");
    }

    return res.status(200).json(new ApiResponse(200, createdUser, "User admin registered Successfully"));
});

const loginAdmin = asyncHandler(async (req, res) => {
    const { username, password, email, phone } = req.body;

    if (!(username || email || phone)) {
        logSuspiciousActivity(req, 'Missing username, email, or phone for login');
        throw new ApiError(400, "Username, email, or phone is required!");
    }

    const user = await Admin.findOne({ $or: [{ username }, { email }, { phone }] });

    if (!user) {
        logSuspiciousActivity(req, 'User does not exist');
        throw new ApiError(401, "User does not exist!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        logSuspiciousActivity(req, 'Incorrect user password');
        throw new ApiError(401, "Incorrect user password!");
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefresToken(user._id);

    const loggedInUser = await Admin.findById(user._id).select("-password -refreshToken");

    const option = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const logoutAdmin = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(req.user._id, { $set: { refreshToken: null } }, { new: true });

    const option = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        logSuspiciousActivity(req, 'No valid refresh token found');
        throw new ApiError(401, "No valid refresh token found!");
    }

    try {
        const decodedRefreshToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await Admin.findById(decodedRefreshToken?._id);

        if (!user) {
            logSuspiciousActivity(req, 'Invalid refresh token');
            throw new ApiError(403, "Invalid refresh token!");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            logSuspiciousActivity(req, 'Invalid or expired refresh token');
            throw new ApiError(403, "Invalid or expired refresh token!");
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefresToken(user._id);

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "User access token refreshed successfully"));
    } catch (error) {
        logSuspiciousActivity(req, 'Failed to refresh access token');
        throw new ApiError(500, "Failed to refresh access token!");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!(currentPassword || newPassword)) {
        logSuspiciousActivity(req, 'Missing current password or new password');
        throw new ApiError(400, "Current password and new password are required!");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
        logSuspiciousActivity(req, 'New password does not meet complexity requirements');
        throw new ApiError(400, "New password must be at least 8 characters long and include uppercase, lowercase, number, and special character!");
    }

    const user = await Admin.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        logSuspiciousActivity(req, 'Incorrect current password');
        throw new ApiError(401, "Incorrect current password!");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully!"));
});

const validateToken = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        logSuspiciousActivity(req, 'Invalid token');
        throw new ApiError(401, "Invalid token!");
    }

    return res.status(200).json(new ApiResponse(200, user, "Token is valid!"));
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
    message: "Too many login attempts from this IP, please try again after 15 minutes"
});

export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    refreshAccessToken,
    changeCurrentPassword,
    validateToken,
    loginLimiter
};
