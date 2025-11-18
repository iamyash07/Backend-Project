import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const uri = `${process.env.MONGODB_URI}/${DB_NAME}`;
        console.log("Connecting to MongoDB...");

        const connectionInstance = await mongoose.connect(uri);

        console.log(`\nMongoDB connected successfully!`);
        console.log(`DB: ${connectionInstance.connection.db.databaseName}`);
        console.log(`Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB connection FAILED:", error.message);
        process.exit(1);
    }
};

export default connectDB;