import {Schema, model} from "mongoose";

const likeSchema = new Schema(
    {
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            required: true,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        tweet: {
            types: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export const Like = model("Like", likeSchema);
