import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannel,
} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/toggle/:channelId").post(toggleSubscription);
router.route("/subscribers").get(getUserChannelSubscribers);
router.route("/subscribed").get(getSubscribedChannel);

export default router;
