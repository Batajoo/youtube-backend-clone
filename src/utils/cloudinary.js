import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

const uploadFile = async (imagePath) => {
    try {
        // Upload the image

        if (!imagePath) return null;

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_KEY,
            api_secret: process.env.CLOUDINARY_SECRET,
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

const deleteFile = async (filePath) => {
    try {
        if (!filePath) return null;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_KEY,
            api_secret: process.env.CLOUDINARY_SECRET,
        });

        const filePathPublicId = filePath.split("/").pop().split(".")[0];
        const result = await cloudinary.uploader.destroy(filePathPublicId);
        return result;
    } catch (error) {
        return null;
    }
};
export {uploadFile, deleteFile};
