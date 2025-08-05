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

export {toggleSubscription};
