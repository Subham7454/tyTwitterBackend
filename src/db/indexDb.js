import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MONGODB CONNECTED !!DB HOST:${connection.connection.host}`)
    } catch (error) {
        console.log("MONGODB CONN ERR:", error)
        process.exit(1)
    }


}

export default connectDB;