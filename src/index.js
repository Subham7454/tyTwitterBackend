import dotenv from "dotenv";
import 'dotenv/config';

import connectDB from "./db/indexDb.js";

dotenv.config({
    path: './env'
})

connectDB()
