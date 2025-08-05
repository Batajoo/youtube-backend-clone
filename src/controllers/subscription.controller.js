import mongoose, {isValidObjectId} from "mongoose";
import {Subscription} from "../models/subscription.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if (!channelId?.trim()) {
        throw new ApiError(400, "Channel Id not found");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Unauthorized: User not found");
    }

    if ([channelId, req.user?._id].some((val) => !isValidObjectId(val))) {
        throw new ApiError(400, "Invalid Object Id");
    }

    const channelObjectId = new mongoose.Types.ObjectId(channelId);
    const subscriberObjectId = new mongoose.Types.ObjectId(req.user._id);

    const subscription = await Subscription.findOne({
        $and: [{channel: channelObjectId}, {subscriber: subscriberObjectId}],
    });

    let updatedSubscription;

    if (!subscription) {
        updatedSubscription = await Subscription.create({
            channel: channelObjectId,
            subscriber: subscriberObjectId,
        });
    } else {
        updatedSubscription = await Subscription.findOneAndDelete({
            $and: [
                {channel: channelObjectId},
                {subscriber: subscriberObjectId},
            ],
        });
    }

    if (!updatedSubscription) {
        throw new ApiError(
            400,
            "Error: Unable to  performing subscription operation to the channel"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {updatedSubscription},
                !subscription
                    ? "Subscribe successful"
                    : "Unsubscribe successful"
            )
        );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Error: Invalid channel Id");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const channelListDetails = await Subscription.aggregate([
        {
            $match: {
                channel: userObjectId,
            },
        },
        {
            $lookup: {
                from: "users",
                let: {subscriberId: "$subscriber"},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$_id", "$$subscriberId"],
                            },
                        },
                    },
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            fullName: 1,
                            avatar: 1,
                            coverImage: 1,
                        },
                    },
                ],
                as: "subscriberInfo",
            },
        },
        {
            $unwind: "$subscriberInfo",
        },
        {
            $group: {
                _id: "$channel",
                subscriberList: {$push: "$subscriberInfo"},
                subscriberCount: {$sum: 1},
            },
        },
        {
            $project: {
                _id: 0,
                channel: "$_id",
                subscriberCount: 1,
                subscriberList: 1,
            },
        },
    ]);

    if (!channelListDetails) {
        throw new ApiError(400, "Error fetching channel list");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelListDetails,
                "Successful fetching channel list"
            )
        );
});

const getSubscribedChannel = asyncHandler(async (req, res) => {
    const userChannelId = req.user?._id;

    if (!isValidObjectId(userChannelId)) {
        throw new ApiError(400, "Invalid user channel Id");
    }

    const userChannelObjectId = new mongoose.Types.ObjectId(userChannelId);

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: userChannelObjectId,
            },
        },
        {
            $lookup: {
                from: "users",
                let: {subscribedId: "$channel"},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$_id", "$$subscribedId"],
                            },
                        },
                    },
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            avatar: 1,
                            coverImage: 1,
                            fullName: 1,
                        },
                    },
                ],
                as: "subscribedToInfo",
            },
        },
        {
            $unwind: "$subscribedToInfo",
        },
        {
            $group: {
                _id: "$subscriber",
                subscribedToList: {
                    $push: "$subscribedToInfo",
                },
                subscribedToCount: {
                    $sum: 1,
                },
            },
        },
        {
            $project: {
                _id: 0,
                channel: "$_id",
                subscribedToList: 1,
                subscribedToCount: 1,
            },
        },
    ]);

    if (!subscribedChannels) {
        throw new ApiError(400, "Error fetching subscribed channels");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "Successful fetching subscribed channels"
            )
        );
});

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannel};
