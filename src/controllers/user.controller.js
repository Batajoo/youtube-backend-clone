import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {uploadFile} from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details
    // check if empty and trim it
    // check if username or email already exists
    // get files avatar and images
    // upload files to cloudinary
    // generateAccess and refresh token
    // save all data
    // return json
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

    const coverImageCloudinary = await uploadFile(coverImageLocalPath);

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

export {registerUser};
