import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;

        if (!accessToken) {
            throw new ApiError(400, "Access Token not found");
        }

        const decodeAccessToken = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET_KEY
        );

        if (!decodeAccessToken?._id) {
            throw new ApiError(400, "Invalid JSON Token");
        }

        const user = await User.findById(decodeAccessToken._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError(400, "Invalid Access Token");
        }

        req.user = user;

        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export {verifyJWT};
