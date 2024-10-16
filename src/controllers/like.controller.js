import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //TODO: toggle like on video
    //get video id
    //get likeById
    //if present delete like if not present add
    //return response

    const likeById = req.user._id;
    if (!videoId && !likeById) {
        new ApiError(400, "please provide videoId and likeId");
    }

    const exsistingLike = await Like.findOne({ video: videoId, likedBy: likeById });
    if (exsistingLike) {
        await Like.deleteOne({ _id: exsistingLike.id })
        return res.status(200).json(new ApiResponse(200, {}, "unlike successfully"))
    } else {
        const newLike = await Like.create({ video: videoId, likedBy: likeById });
        return res.status(200).json(new ApiResponse(200, newLike, "like video successfully"))
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    const commentLikeBy = req.user._id;

    if (!commentId && !commentLikeBy) {
        throw new ApiError(400, "commentId and  commentLikeBy is required")
    }

    const existedComment = await Like.findOne({ comm: commentId, likedBy: commentLikeBy });
    if (existedComment) {
        await Like.deleteOne({ _id: existedComment.id })
        return res.status(200).json(new ApiResponse(200, {}, "unlike comment sucessfully"))
    } else {
        const newLike = await Like.create({ comm: commentId, likedBy: commentLikeBy })
        return res.status(200).json(new ApiResponse(200, newLike, "liked comment sucessfully"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const likedById = req.user._id;

    if (!tweetId || !likedById) {
        return res.status(400).json(new ApiError(400, "tweetId and likedById are required"));
    }

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: likedById });

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, {}, "Tweet unliked successfully"));
    } else {
        const newLike = await Like.create({ tweet: tweetId, likedBy: likedById });
        return res.status(200).json(new ApiResponse(200, newLike, "Tweet liked successfully"));
    }
});


const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    //get likedbyId
    //do match kikedBy
    //join like and video schema
    //unwind to get single obj
    //project it to get specifc details
    const likeById = req.user._id;
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: likeById,
                video: { $exist: true }
            }
        },
        {
            $lookup: {
                form: 'videos',  //collecton to join whith,remeber Video model becomes videos in mongodb
                localField: vidio,
                foreignField: '_id',
                as: 'videoDetails'
            }
        },
        {
            $unwind: '$videoDetails'
        },
        {
            $project: {
                _id: 0,//exclude
                'videoDetails._id': 1,//include the video id
                'videoDetails.videoFile': 1,
                'videoDetails.thumbnail': 1,
                'videoDetails.tittle': 1,
                'videoDetails.description': 1,
                'videoDetails.duration': 1,
                'videoDetails.views': 1,
                'videoDetails.isPunlished': 1,
                'videoDetails.owner': 1,
                'videoDetails.createdAt': 1,
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos retrieved successfully"));
});



export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}