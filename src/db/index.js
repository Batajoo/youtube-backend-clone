import mongoose from "mongoose";
import {dbName} from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${dbName}`
        );
        console.log(
            `\nMongoDB connected!! DB Host: ${connectionInstance.connection.host}`
        );
        return connectionInstance;
    } catch (error) {
        console.error("MongoDB connection Failed: (connectDB)", error);
        process.exit(1);
    }
};

export {connectDB};
