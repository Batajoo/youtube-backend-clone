import {Router} from "express";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    registerUser,
    loginUser,
    logOutUser,
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

export default router;
