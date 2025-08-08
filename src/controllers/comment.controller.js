import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {Comment} from "../models/comment.model.js";
import mongoose from "mongoose";

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {commentContent} = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }
});

export {addComment};
