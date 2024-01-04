import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        // Check if token exists
        if (!token) {
            throw new ApiError(401, "Unauthorized request: Token missing");
        }
    
        // Verify token authenticity
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // Retrieve user based on token data
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        // Check if user exists
        if (!user) {
            throw new ApiError(401, "Unauthorized request: User not found");
        }
    
        // Attach user information to the request object
        req.user = user;
        next();
    } catch (error) {
        // Handle and propagate errors
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Unauthorized request: Invalid token");
        } else if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Unauthorized request: Token expired");
        } else {
            throw new ApiError(401, error?.message || "Unauthorized request: Invalid access token");
        }
    }
});
