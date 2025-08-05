import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {uploadFile} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (id) => {
    try {
        if (!id) {
            throw new ApiError(500, "Server error: required id");
        }

        const user = await User.findById(id);

        if (!user) {
            throw new ApiError(400, "Error: User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        throw error;
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const {username, email, fullName, password} = req.body;

    if (
        [username, email, fullName, password].some(
            (value) => value.trim() === ""
        )
    ) {
        throw new ApiError(400, "Field is empty");
    }

    if (await User.findOne({$or: [{email}, {username}]})) {
        throw new ApiError(400, "User already exists");
    }

    const avatarLocalPath = req?.files?.avatar[0].path;
    let coverImageLocalPath;

    if (
        req?.files &&
        Array.isArray(req.files?.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar not found");
    }

    const avatarCloudinary = await uploadFile(avatarLocalPath);

    const coverImageCloudinary =
        (await uploadFile(coverImageLocalPath)) || null;

    if (!avatarCloudinary) {
        throw new ApiError(400, "Error uploading to file to cloud");
    }

    const userData = await User.create({
        username,
        email,
        fullName,
        avatar: avatarCloudinary?.url,
        coverImage: coverImageCloudinary?.url || "",
        password,
    });

    if (!userData) {
        throw new ApiError(400, "Error creating user data");
    }

    const createUser = await User.findById(userData?._id).select(
        "-password -refreshToken"
    );

    if (!createUser) {
        throw new ApiError(400, "Error creating user");
    }

    return res.status(200).json(new ApiResponse(200, createUser, "success"));
});

const loginUser = asyncHandler(async (req, res) => {
    // get user, email and password from body
    // search if user or email if user exists or not
    // if use exists generate access and refresh token
    // return cookies and json response

    const {username, email, password} = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Email or Username field is empty");
    }

    if (!password) {
        throw new ApiError(400, "Password field is empty");
    }

    const user = await User.findOne({$or: [{email}, {username}]});

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const checkPassword = await user.comparePassword(password);

    if (!checkPassword) {
        throw new ApiError(400, "Password Invalid");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
        user._id
    );

    if (!accessToken || !refreshToken) {
        throw new ApiError("Error generating login tokens");
    }

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    refreshToken,
                    accessToken,
                },
                "Login Successful"
            )
        );
});

const logOutUser = asyncHandler(async (req, res) => {
    if (!req?.user) {
        throw new ApiError("User not logged in ");
    }

    const user = await User.updateOne(
        {_id: req.user?._id},
        {
            $unset: {
                refreshToken: 1,
            },
        }
    );

    if (!user) {
        throw new ApiError("Error logging out");
    }

    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(200, {}, "log out successful"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {currentPassword, newPassword} = req.body;

    if ([currentPassword, newPassword].some((val) => val.trim() === "")) {
        throw new ApiError(400, "Empty required fields");
    }

    const user = await User.findById(req.user?._id);

    const verifyPassword = await user.comparePassword(currentPassword);

    if (!verifyPassword) {
        throw new ApiError(400, "Current Password is incorrect");
    }

    user.password = newPassword;
    const updatedUser = await user.save();

    if (!updatedUser) {
        throw new ApiError(400, "Failed updating password");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password updated succcessfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken =
        req.cookies?.refreshToken || body?.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiError(400, "Refresh Token not found");
    }

    const userId = await jwt.verify(
        incommingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET_KEY
    );

    if (!userId) {
        throw new ApiError(400, "Invalid refresh Token");
    }

    const user = await User.findById(userId?._id);

    if (!user) {
        throw new ApiError(400, "Invalid token");
    }

    const checkRefreshToken = user.refreshToken === incommingRefreshToken;

    if (!checkRefreshToken) {
        throw new ApiError(400, "Invalid refresh token");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
        user?._id
    );

    if (!accessToken || !refreshToken) {
        throw new ApiError(400, "Error generating tokens");
    }

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: {
                        accessToken,
                        refreshToken,
                    },
                },
                "Success refreshing tokens"
            )
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: req.user,
            },
            "Current user sent successfully"
        )
    );
});

const updateUserAccountDetails = asyncHandler(async (req, res) => {
    const {email, username} = req.body;

    if (!email && !username) {
        throw new ApiError(400, "Required field are empty");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            email: email || req.user?.email,
            username: username || req.user?.username,
        },
    }).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(400, "Error updating user account");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {user}, "Successful updating user"));
});

const updateUserAvater = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Required field for avatar image in not found");
    }

    const avatarCloudinaryFile = await uploadFile(avatarLocalPath);

    if (avatarCloudinaryFile.path) {
        throw new ApiError(400, "Error uploading avatar image");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatarCloudinaryFile.path,
        },
    }).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(400, "Error updating avatar image: ");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user,
            },
            "Successful updating avatar image"
        )
    );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(
            400,
            "Required field for coverImage image in not found"
        );
    }

    const coverImageCloudinaryFile = await uploadFile(coverImageLocalPath);

    if (coverImageCloudinaryFile.path) {
        throw new ApiError(400, "Error uploading coverImage image");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImageCloudinaryFile.path,
        },
    }).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(400, "Error updating coverImage image: ");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user,
            },
            "Successful updating coverImage image"
        )
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    //
    const {username} = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Error Invalid username");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers",
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetch successfully")
        );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0]?.watchHistory,
                "Watch History fetched successfully"
            )
        );
});

export {
    registerUser,
    loginUser,
    logOutUser,
    changeCurrentPassword,
    refreshAccessToken,
    getCurrentUser,
    updateUserAccountDetails,
    updateUserAvater,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};
