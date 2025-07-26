import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {uploadFile} from "../utils/cloudinary.js";

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

export {registerUser, loginUser, logOutUser};
