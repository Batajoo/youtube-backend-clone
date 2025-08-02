import {Router} from "express";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    registerUser,
    loginUser,
    logOutUser,
    changeCurrentPassword,
    getCurrentUser,
    refreshAccessToken,
    updateUserAccountDetails,
    updateUserAvater,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1},
    ]),
    registerUser
);
router.route("/login").post(loginUser);

//protected routes
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/refresh-token").get(verifyJWT, refreshAccessToken);
router.route("/update-account").post(verifyJWT, updateUserAccountDetails);
router
    .route("/update-avatar")
    .post(verifyJWT, upload.single("avatar"), updateUserAvater);
router
    .route("/update-coverImage")
    .post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);
export default router;
