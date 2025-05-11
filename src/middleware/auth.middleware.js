import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            throw new ApiError(401, "Authentication required. No access token provided");
        }
    
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
            const user = await Admin.findById(decodedToken?._id).select("-password -refreshToken")
        
            if (!user) {
                throw new ApiError(401, "Invalid access token: User not found");
            }
            req.user = user;
            next()
        } catch (tokenError) {
            // Handle specific JWT errors with clearer messages
            if (tokenError.name === 'TokenExpiredError') {
                throw new ApiError(401, "Access token has expired. Please refresh or login again");
            } else if (tokenError.name === 'JsonWebTokenError') {
                throw new ApiError(401, "Invalid access token format");
            } else {
                throw new ApiError(401, tokenError?.message || "Invalid access token");
            }
        }
    } catch (error) {
        throw new ApiError(401, error?.message || "Authentication failed");
    }
})

export const checkUserRole = (req) => {
    if (!req.user || !req.user.role) {
        throw new ApiError(401, "Unauthorized! User information is missing.");
    }
    if (req.user.role !== "admin" && req.user.role !== "contentManager") {
        throw new ApiError(403, "Access denied! Admins and Content Managers only.");
    }
};

export const checkAdmin = (req) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Access denied! Admins only.");
    }
};

