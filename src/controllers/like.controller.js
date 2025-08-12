import mongoose, {isValidObjectId} from "mongoose";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Like} from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Error: Invalid object Id");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Error: User not logged in ");
    }
    const like = await Like.findOne({
        likedBy: req.user?._id,
        video: videoId,
    });

    let newLike;
    if (!like) {
        newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id,
        });
    } else {
        newLike = await Like.findByIdAndDelete(like._id, {
            video: 1,
        });
    }

    if (!newLike) {
        throw new ApiError(400, "Error: Failed to toggle video like");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike,
                !like
                    ? "Successful liking the video"
                    : "Successful unliking the video"
            )
        );
});

export {toggleVideoLike};
