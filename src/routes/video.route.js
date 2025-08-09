import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideo,
} from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideo)
    .post(
        upload.fields([
            {name: "video", maxCount: 1},
            {name: "thumbnail", maxCount: 1},
        ]),
        publishVideo
    );
router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(
        upload.fields([
            {name: "video", maxCount: 1},
            {name: "thumbnail", maxCount: 1},
        ]),
        updateVideo
    );
router.route("/toggle/:videoId").post(togglePublishStatus);
export default router;
