import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        username: {
            type: String,
            lowercase: true,
            unique: true,
            required: true,
            index: true,
            trim: true,
        },

        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
        },

        avatar: {
            type: String,
            required: true,
        },

        coverImage: {
            type: String,
            required: true,
        },

        password: {
            type: String,
            required: true,
        },

        refreshToken: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.method("generateAccessToken", function () {
    return jwt.sign(
        {
            _id: this._id,
            userSchema: this.username,
            email: this.email,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET_KEY,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
});

userSchema.method("generateRefreshToken", function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
});

export const User = mongoose.model("User", userSchema);
