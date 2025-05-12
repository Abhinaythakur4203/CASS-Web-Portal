import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { checkAdmin, checkUserRole } from '../middleware/auth.middleware.js';



const generateAccessTokenAndRefresToken = async (userId) => {

    try {
        const user = await Admin.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "something went wrong while genrating access token and refresh token");
    }

};


const registerAdmin = asyncHandler(async (req, res) => {
    const { firstName, lastName, username, password, email, phone, role } = req.body;

    const avatar = req.file?.path || null;

    if ([firstName, lastName, username, password, email, phone].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required!")
    }

    const existingAdmin = await Admin.findOne(
        {
            $or: [
                { username },
                { email },
            ]
        }
    )

    const existingPhone = await Admin.findOne({ phone })

    if (existingPhone) {
        throw new ApiError(409, "User with this phone number already exists!");
    }

    if (existingAdmin) {
        throw new ApiError(409, "User with username/email already exists!");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        throw new ApiError(400, "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character!");
    }

    let uploadAvatar = null;

    if (req.file) {
        try {
            uploadAvatar = await uploadOnCloudinary(req.file.path);

            if (!uploadAvatar.url) {
                throw new ApiError(400, "Error while uploading avatar!");
            }
        } catch (error) {
            throw new ApiError(500, "Failed to upload avatar!");
        }
    }

    const user = await Admin.create({
        displayName: {
            first: firstName,
            last: lastName,
        },
        username,
        password,
        email,
        phone,
        avatar: uploadAvatar?.url || null,
        role
    })

    const createdUser = await Admin.findById(user._id).select(
        '-password'
    )

    if (!createdUser) {
        throw new ApiError(500, "Failed to register user admin!")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "User admin registered Successfully")
    )

})

const loginAdmin = asyncHandler(async (req, res) => {

    const { username, password, email, phone } = req.body;

    if (!(username || email || phone)) {
        throw new ApiError(400, "Username, email, or phone is required!")
    }

    const user = await Admin.findOne({
        $or:
            [{ username }, { email }, { phone }]
    })

    if (!user) {
        throw new ApiError(401, "User does not exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect user password!")
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefresToken(user._id);

    const loggedInUser = await Admin.findById(user._id).
        select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully")
        )

});

const logoutAdmin = asyncHandler(async (req, res) => {

    await Admin.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        { new: true }
    )

    const option = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"))
});



const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "No valid refresh token found!");
    }

    try {
        const decodedRefreshToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await Admin.findById(decodedRefreshToken?._id);

        if (!user) {
            throw new ApiError(403, "Invalid refresh token!");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
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
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "User access token refreshed successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Failed to refresh access token!");

    }

});

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { currentPassword, newPassword } = req.body;

    if (!(currentPassword || newPassword)) {
        throw new ApiError(400, "Current password and new password are required!")
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
        throw new ApiError(400, "New password must be at least 8 characters long and include uppercase, lowercase, number, and special character!");
    }

    const user = await Admin.findById(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect current password!")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.
        status(200).
        json(
            new ApiResponse(200, {}, "Password changed successfully!")
        )

})

const validateToken = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "Invalid token!");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Token is valid!"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, username, email, phone } = req.body;

    if ([firstName, lastName, username, email, phone].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required!");
    }

    const existingAdmin = await Admin.findOne(
        {
            $or: [
                { email },
                { username },
            ]
        }
    );

    if (existingAdmin && existingAdmin._id.toString() !== req.user._id.toString()) {
        throw new ApiError(409, "User with this email/username already exists!");
    }

    const existingPhone = await Admin.findOne({ phone });

    if (existingPhone && existingPhone._id.toString() !== req.user._id.toString()) {
        throw new ApiError(409, "User with this phone number already exists!");
    }

    const user = await Admin.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    user.displayName.first = firstName || user.displayName.first;
    user.displayName.last = lastName || user.displayName.last;
    user.username = username || user.username;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    await user.save({ validateBeforeSave: false });

    const updatedUser = await Admin.findById(user._id).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user profile!");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User profile updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarPath = req.file?.path;

    if (!avatarPath) {
        throw new ApiError(400, "Avatar is required!");
    }

    const user = await Admin.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    try {
        const uploadedAvatar = await uploadOnCloudinary(avatarPath);

        if (!uploadedAvatar.url) {
            throw new ApiError(400, "Error while uploading avatar!");
        }

        // Delete old avatar from Cloudinary if it exists
        if (user.avatar) {
            await deleteFromCloudinary(user.avatar);
        }

        // Update user's avatar
        user.avatar = uploadedAvatar.url;
        await user.save({ validateBeforeSave: false });

        const updatedUser = await Admin.findById(user._id).select("-password -refreshToken");

        if (!updatedUser) {
            throw new ApiError(500, "Failed to update user avatar!");
        }

        return res.status(200).json(
            new ApiResponse(200, updatedUser, "User avatar updated successfully")
        );
    } catch (error) {
        throw new ApiError(500, `Failed to update avatar: ${error.message}`);
    }
});

const getUserProfile = asyncHandler(async (req, res) => {

    checkAdmin(req);

    const user = await Admin.findOne({ role: 'user' }).select("-password -refreshToken -role");

    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User profile fetched successfully")
        );

});

export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    refreshAccessToken,
    changeCurrentPassword,
    validateToken,
    updateUserProfile,
    updateUserAvatar,
    getUserProfile
}