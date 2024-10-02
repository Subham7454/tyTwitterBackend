import dotenv from "dotenv";
import 'dotenv/config';
import app from "./app.js";
import connectDB from "./db/indexDb.js";

dotenv.config({
    path: './env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`server is runnig on port ${process.env.PORT}`)
        })

    })
    .catch((err) => {
        console.log("DB Connection failed !!!", err)
    })
