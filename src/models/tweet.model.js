import mongoose, { Schema } from "mongoose";


const tweetSchema = new mongoose.Schema({

    content: {
        type: String,
        required: true
    },


    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },


});

export const Tweet = mongoose.model("Tweet", playlistSchema)