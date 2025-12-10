console.log("🔥 STARTING NODE SERVER...");

process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION");
  console.error(err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED PROMISE REJECTION");
  console.error(err);
});

import { config } from "dotenv";
config({ path: "./.env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";

console.log("===== ENV CHECK =====");
console.log("PORT:", process.env.PORT);
console.log("MONGO EXISTS:", !!process.env.MONGODB_URI);

connectDB()
  .then(() => {
    console.log("📌 DB connected — now starting server...");

    const PORT = process.env.PORT || 5050;

    // 🔥 FIX: FORCE IPV4 ONLY
   const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Running at http://localhost:${PORT}`);
});


    server.on("error", (err) => {
      console.log("🔥 SERVER LISTEN ERROR:", err);
    });

    console.log("📌 After listen call — if you don't see LISTENING above, server crashed!");
  })
  .catch((err) => {
    console.log("❌ ERROR CONNECTING DB:", err);
  });
