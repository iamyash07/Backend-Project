// require ('dotenv').config({path:'./env'})


import fotenv from "dotenv"
import connectDB from "./db";



// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";



cdotenv.config({

    path: './env'
})


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, ()=> {
            console.log(`server is running at port: ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!!", err);
    })




















// import express from "express"
// const app = express();

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODBp_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("Error", error);
//             throw error
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error("ERROR", error)
//         throw err
//     }
// })()
