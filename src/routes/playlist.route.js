import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideofromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/u/:userId").get(getUserPlaylists);
router.route("/:playlistId").get(getPlaylistById);

//protected routes
router.use(verifyJWT);
router.route("/").post(createPlaylist);
router.route("/:playlistId").delete(deletePlaylist).patch(updatePlaylist);
router
    .route("/:playlistId/:videoId")
    .post(addVideoToPlaylist)
    .delete(removeVideofromPlaylist);

export default router;
