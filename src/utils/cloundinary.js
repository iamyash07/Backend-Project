// src/utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary (must be v2)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        console.log("Uploading to Cloudinary:", localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "chai-backend"  // optional: keeps your files organized
        });

        console.log("SUCCESS → Cloudinary URL:", response.url);
        
        // Delete local file after success
        fs.unlinkSync(localFilePath);
        
        return response;

    } catch (error) {
        console.error("CLOUDINARY UPLOAD FAILED:", error.message || error);
        
        // Safely delete local file even if upload fails
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        return null; // ← THIS WAS MISSING → your register was failing silently!
    }
};

export { uploadOnCloudinary };