import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required")
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })
    return res
        .status(200).json(new ApiResponse(200, tweet, "tweet created successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    //algo
    //find id
    //from this id find owner and return its response
    const user = req.user.id

    const tweet = await Tweet.find({ owner: user })
    if (!tweet.length) {
        throw new ApiError(404, "no tweets found for this user")
    }

    return res.status(200).json(new ApiResponse(200, tweet, "user tweets retrived successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    //req content and id from body
    //find tweet id and update
    const { tweetID } = req.params; // Fetch tweetID from URL parameters
    const { content } = req.body;

    if (!tweetID || !content) {
        throw new ApiError(404, "please rovide all details id and content required")

    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetID,
        {
            $set: {
                content: content
            }
        },
        {

            new: true
        }
    )

    if (!updatedTweet) {
        throw new ApiError(404, "Tweet not found");
    }
    return res.status(200)
        .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"))


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    //find the id of tweet
    //usnet
    const { tweetId } = req.params;
    if (!tweetId) {
        throw new ApiError(404, "tweetId is missing")
    }


    // Find the tweet by ID and delete it
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) {
        throw new ApiError(404, "Tweet not found");
    }

    return res.status(200)
        .json(new ApiResponse(200, {}, "tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}