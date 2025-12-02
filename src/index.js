import { config } from "dotenv";
config({ path: "./.env" });  // ← must be the very first line

import connectDB from "./db/index.js";
import { app } from "./app.js";

console.log("ENV LOADED SUCCESSFULLY");
console.log("PORT:", process.env.PORT);
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch(err => console.log("MongoDB connection FAILED ", err));


















