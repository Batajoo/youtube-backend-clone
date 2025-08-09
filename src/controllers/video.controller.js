import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {Video} from "../models/video.model.js";
import {uploadFile, deleteFile} from "../utils/cloudinary.js";
import mongoose, {isValidObjectId} from "mongoose";

const getAllVideo = asyncHandler(async (req, res) => {
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;

    if ([query, sortBy, sortType, userId].some((val) => val?.trim() === "")) {
        throw new ApiError(400, "Error: Required fields empty");
    }

    const pipeline = [
        {
            $match: {
                $or: [
                    {
                        title: {
                            $regex: query,
                        },
                    },
                    {
                        description: {
                            $regex: query,
                        },
                    },
                    {
                        owner: userId,
                    },
                ],
            },
        },
        {
            $sort: {
                sortBy: sortType === "asc" ? 1 : -1,
            },
        },
    ];

    const options = {
        page,
        limit,
    };

    const aggregate = Video.aggregate(pipeline);

    const videos = await Video.aggregatePaginate(aggregate, options);

    if (!videos) {
        throw new ApiError(400, "Error: Unable to get videos from cloud");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body;
    const localVideoFileUrl = req.files["video"]?.[0];
    const localThumbnailUrl = req.files["thumbnail"]?.[0];

    if (!req.user?._id) {
        throw new ApiError(400, "UnAuthorized: Authentication failed");
    }

    if (
        [
            title,
            description,
            localVideoFileUrl?.path,
            localThumbnailUrl?.path,
        ].some((val) => val.trim() === "")
    ) {
        throw new ApiError(400, "Error: Required fields are empty.");
    }

    const videoFileCloudinary = await uploadFile(localVideoFileUrl.path);
    const thumbNailCloudinary = await uploadFile(localThumbnailUrl.path);

    if (!videoFileCloudinary?.url || !thumbNailCloudinary?.url) {
        throw new ApiError(400, "Error: Failed uploading to the cloud");
    }

    const video = await Video.create({
        videoFile: videoFileCloudinary.url,
        thumbnail: thumbNailCloudinary.url,
        owner: req.user?._id,
        title,
        description,
        duration: videoFileCloudinary?.duration || "0.0",
        views: 0,
        isPublished: false,
        thumbnailPublicId: thumbNailCloudinary.public_id,
        videoPublicId: videoFileCloudinary.public_id,
    });

    if (!video) {
        throw new ApiError(400, "Error: Failed creating video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Upload Successful"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid: VideoId invalid");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Unauthorized: Auth not valid");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Error: Video not found");
    }

    if (!video?.owner === req.user?._id && !video?.isPublished) {
        throw new ApiError(400, "Unauthorized: Video not published");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    const localVideoFile = req.files["video"]?.[0]?.path || "";
    const localThumbnailFile = req.files["thumbnail"]?.[0]?.path || "";

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid: VideoId invalid");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "NotFound: Video not found");
    }

    console.log(video);

    if (!video.owner.equals(req.user?._id)) {
        throw new ApiError(400, "Unauthorized: owner not matched");
    }

    if (!localVideoFile && !localThumbnailFile) {
        throw new ApiError(400, "Missing: Required inputs not found");
    }

    let newVideoFile;
    if (localVideoFile) {
        const videoDeleteURL = video.videoFile;
        const deleteCloudinary = await deleteFile(videoDeleteURL);

        if (deleteCloudinary?.result !== "ok") {
            throw new ApiError(400, "Failed to delete in cloud");
        }
        newVideoFile = await uploadFile(localVideoFile);

        if (!newVideoFile?.url) {
            throw new ApiError(400, "Failed uploading to cloud");
        }
    }

    let newThumbnailFile;
    if (localThumbnailFile) {
        const thumbnailDeleteURL = video.thumbnail;
        const deleteCloudinary = await deleteFile(thumbnailDeleteURL);

        if (!deleteCloudinary) {
            throw new ApiError(400, "Failed to delete in cloud");
        }
        newThumbnailFile = await uploadFile(localThumbnailFile);

        if (!newThumbnailFile?.url) {
            throw new ApiError(400, "Failed uploading to cloud");
        }
    }

    const newVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            videoFile: newVideoFile?.url || video?.videoFile,
            thumbnail: newThumbnailFile?.url || video?.thumbnail,
            duration: newVideoFile?.duration || video?.duration,
        },
    });

    if (!newVideo) {
        throw new ApiError(400, "Error: Failed to update video object");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    if (!video.owner.equals(req.user?._id)) {
        throw new ApiError(400, "Unauthorized: Owner not matched");
    }

    const deleteVideoCloudinary = await deleteFile(video.videoFile);

    if (!deleteVideoCloudinary) {
        throw new ApiError(400, "Failed deletion in cloud");
    }

    const videoStatus = await Video.findByIdAndDelete(videoId);

    if (!videoStatus) {
        throw new ApiError(400, "Failed deleting video data");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoStatus, "Successful Video deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    if (!video.owner.equals(req.user?._id)) {
        throw new ApiError(400, "Unauthorized: Owner not matched");
    }

    const newStatus = !video.isPublished;

    const newVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished: newStatus,
        },
    });

    if (!newVideo) {
        throw new ApiError(400, "Failed to update published status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newVideo,
                newVideo.isPublished
                    ? "Successfully published"
                    : "Successfully unpublished"
            )
        );
});

export {
    getAllVideo,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
