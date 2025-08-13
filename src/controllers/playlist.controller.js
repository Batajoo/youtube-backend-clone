import mongoose, {isValidObjectId} from "mongoose";
import {Playlist} from "../models/playlist.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;

    if ([name, description].some((value) => value?.trim() === "")) {
        throw new ApiError(400, "Missing: Required fields are empty");
    }

    const user = req.user?._id;
    if (!user) {
        throw new ApiError(400, "Unauth: User not authorized");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: user,
    });

    if (!playlist) {
        throw new ApiError(400, "Error: Unable to crete playlist object");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Successfully created playlist"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Error: Invalid user id");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
            },
        },
    ]);

    if (!playlists) {
        throw new ApiError(400, "Unable to find a playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "Playlists fetched successfully")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Error: Invalid playlist Id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(400, "Error: Unable to find the playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if ([playlistId, videoId].some((val) => !isValidObjectId(val))) {
        throw new ApiError(400, "Error: Invalid object id");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Unauth: User not authorized");
    }

    const playlist = await Playlist.findOne({
        _id: playlistId,
        videos: {
            $in: [videoId],
        },
    });

    if (playlist) {
        throw new ApiError(400, "Video already added to the playlist");
    }

    const newPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId,
            },
        },
        {new: true}
    );

    if (!newPlaylist) {
        throw new ApiError(400, "Failed to add video to the playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newPlaylist,
                "Video added to playlist successfully"
            )
        );
});

const removeVideofromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if ([playlistId, videoId].some((val) => !isValidObjectId(val))) {
        throw new ApiError(400, "Error: Invalid object id");
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Unauth: User not authorized");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId,
            },
        },
        {new: true}
    );

    if (!playlist) {
        throw new ApiError(400, "Error: Playlist or video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Successfully removed video from playlist"
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Error: Invalid playlist Id");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId, {new: true});

    if (!playlist) {
        throw new ApiError(400, "Playlist not found for deletion");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Successful deleting playlist"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Error: Invalid object id");
    }

    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "Missing: Missing required field/s");
    }

    const updateData = {};

    if (name?.trim()) updateData.name = name;
    if (description?.trim()) updateData.description = description;

    const newPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$set: updateData},
        {new: true}
    );

    if (!newPlaylist) {
        throw new ApiError(400, "Error: Unable to update the playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, newPlaylist, "Successfully update playlist")
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideofromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
