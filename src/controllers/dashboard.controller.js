import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import {Video} from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js";
import {Like} from "../models/like.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const user = req.user?._id;

    if (!user) {
        throw new ApiError(400, "Unauth: User not authorized");
    }

    const videos = await Video.aggregate([
        {
            $match: {
                owner: user,
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "totalLikes",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$totalLikes",
                },
                subscribers: {
                    $size: "$subscribers",
                },
            },
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views",
                },
                totalVideos: {
                    $sum: 1,
                },
                totalLikes: {
                    $sum: "$totalLikes",
                },
                subscriberCount: {
                    $first: "$subscribers",
                },
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
    ]);

    if (!videos) {
        throw new ApiError(400, "Error: Channel data not found");
    }
    const videoOutput = videos?.length
        ? videos?.[0]
        : {
              subscriberCount: 0,
              totalViews: 0,
              totalVideos: 0,
              totalLikes: 0,
          };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoOutput,
                "Successfully fetched channel stats"
            )
        );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const user = req.user?._id;

    if (!user) {
        throw new ApiError(400, "Unauth: User not authorized");
    }

    const allVideos = await Video.aggregate([
        {
            $match: {
                owner: user,
            },
        },
    ]);

    if (!allVideos) {
        throw new ApiError(400, "Channel videos not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allVideos,
                "Successfully fetched all channel videos"
            )
        );
});

export {getChannelStats, getChannelVideos};
