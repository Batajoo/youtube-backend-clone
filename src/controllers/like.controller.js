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
        newLike = await Like.findByIdAndDelete(like._id);
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

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Error: Invalid Comment Id");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Error: User not authorized");
    }

    const like = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    let newLike;
    if (!like) {
        newLike = await Like.create({
            likedBy: req.user?._id,
            comment: commentId,
        });
    } else {
        newLike = await Like.findByIdAndDelete(like?._id);
    }

    if (!newLike) {
        throw new ApiError(400, "Error: Failed to update Like object");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike,
                like
                    ? "Successful unliking the comment"
                    : "Successful liking the comment"
            )
        );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Error: Invalid Comment Id");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Error: User not authorized");
    }

    const like = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    let newLike;
    if (!like) {
        newLike = await Like.create({
            likedBy: req.user?._id,
            tweet: tweetId,
        });
    } else {
        newLike = await Like.findByIdAndDelete(like?._id);
    }

    if (!newLike) {
        throw new ApiError(400, "Error: Failed to update Like object");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newLike,
                like
                    ? "Successful unliking the tweet"
                    : "Successful liking the tweet"
            )
        );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const user = req.user?._id;
    if (!user) {
        throw new ApiError(400, "Unauth: User not authorized");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: user,
                video: {
                    $exists: true,
                },
            },
        },
        {
            $project: {
                video: 1,
            },
        },
    ]);

    if (!likedVideos) {
        throw new ApiError(400, "Error: Failed to get data from db");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Successfully fetched liked videos"
            )
        );
});

export {toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos};
