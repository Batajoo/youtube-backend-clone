import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());

app.use(
    express.json({
        limit: "16kb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    })
);

app.use(cookieParser());

app.use(express.static("public"));

// user router
import userRouter from "./routes/user.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import commentRouter from "./routes/comment.route.js";
import videoRouter from "./routes/video.route.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/video", videoRouter);

export {app};
