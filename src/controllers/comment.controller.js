import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {Comment} from "../models/comment.model.js";
import mongoose from "mongoose";

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {content} = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "UnAuthorized: Not logged in");
    }

    const comment = await Comment.create({
        video: videoId,
        content,
        owner: req.user.id,
    });

    if (!comment) {
        throw new ApiError(400, "Error: Unable to create comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    if (!content) {
        throw new ApiError(400, "Error: Required Field/s missing");
    }

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Error: Comment ID not valid");
    }

    const commentUser = await Comment.findById(commentId);

    if (!commentUser?.owner.equals(req.user?._id)) {
        throw new ApiError(
            400,
            "Unauthorized: User not the owner of this comment"
        );
    }

    const comment = await Comment.findByIdAndUpdate(commentId, {
        $set: {
            content: content,
        },
    });

    if (!comment) {
        throw new ApiError(400, "Error: Comment not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Suceesfully updated comment"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(200, "Invalid: comment id invalid");
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
        throw new ApiError(400, "Error: Comment not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Successfully deleted comment"));
});

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(200, "Invalid: video id invalid");
    }

    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
    ]);

    const options = {
        page,
        limit,
    };

    const comments = await Comment.aggregatePaginate(aggregate, options);

    if (!comments) {
        throw new ApiError(400, "Error: Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comments,
                "Successfully fetched video comments"
            )
        );
});

export {addComment, updateComment, deleteComment, getVideoComments};
