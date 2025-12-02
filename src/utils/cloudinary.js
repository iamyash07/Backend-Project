import { config } from "dotenv";
config({ path: "./.env" });   // ← load dotenv here first!

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

console.log("==== CLOUDINARY CONFIG CHECK ====");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING");
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "LOADED" : "MISSING");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const realPath = fs.realpathSync.native(localFilePath);
        console.log("Uploading from real path:", realPath);

        const result = await cloudinary.uploader.upload(realPath, {
            resource_type: "auto",
            folder: "chai-tube"
        });

        console.log("Cloudinary Upload Success:", result.secure_url);
        fs.unlinkSync(localFilePath);
        return result;

    } catch (error) {
        console.error("CLOUDINARY FAILED:", error.message);
        try { fs.unlinkSync(localFilePath); } catch (err) {}
        return null;
    }
};

export { uploadOnCloudinary };

