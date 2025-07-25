import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

const uploadImage = async (imagePath) => {
    try {
        // Upload the image

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_KEY,
            api_secret: process.env.CLOUDINARY_SECRET,
            secure: true,
        });
        const result = await cloudinary.uploader.upload(imagePath, {
            resource_type: "auto",
        });
        fs.unlinkSync(imagePath);
        return result;
    } catch (error) {
        fs.unlinkSync(imagePath);
        return null;
    }
};

export {uploadImage};
