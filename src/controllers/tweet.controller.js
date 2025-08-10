import mongoose, {isValidObjectId} from "mongoose";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {Tweet} from "../models/tweet.model.js";
import {User} from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;

    if (content?.trim() === "") {
        throw new ApiError(400, "Error: Required field/s not found");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Unauth: User not logged in");
    }

    const tweet = await Tweet.create({
        owner: req.user._id,
        content: content,
    });

    if (!tweet) {
        throw new ApiError(400, "Error: Tweet couldn't be created");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Successful creating tweet"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const {tweetId} = req.params;

    if (content?.trim() === "") {
        throw new ApiError(400, "Error: Required Fields Empty");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Error: Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet.owner?.equals(req.user?._id)) {
        throw new ApiError(400, "Error: Owner and user not matching");
    }

    const newTweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content: content,
        },
    });

    if (!newTweet) {
        throw new ApiError(400, "Error: Failed creating new Tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newTweet, "Successful creating new tweet"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Error: Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet.owner?.equals(req.user?._id)) {
        throw new ApiError(400, "Error: Owner and user not matching");
    }

    const newTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!newTweet) {
        throw new ApiError(400, "Error: Failed Deleting tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newTweet, "Successfully deleted tweet"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Error: Invalid user id");
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $project: {
                content: 1,
            },
        },
    ]);

    if (!tweets) {
        throw new ApiError(400, "Failed getting tweets");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Successfully fetched tweets"));
});

export {createTweet, updateTweet, deleteTweet, getUserTweets};
