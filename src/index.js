import {config} from "dotenv";
config({
    path: "./.env",
});

import {connectDB} from "./db/index.js";
import {app} from "./app.js";

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error;
        });
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server running at port: ${process.env.PORT || 3000}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection Failed !!! (main)", error);
        process.exit(1);
    });
