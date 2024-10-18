import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const { userId } = req.params
    if (!userId) {
        throw new ApiError(400, "channelId is required")
    }
    const totalSubscriber = await Subscription.countDocuments({ channel: userId })

    const totalVideos = await Video.countDocuments({ owner: userId });


    const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ owner: userId }).select('_id') } });


    const totalViews = await Video.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    const totalViewsCount = totalViews.length > 0 ? totalViews[0].totalViews : 0;

    return res.status(200).json(new ApiResponse(200, {
        totalSubscriber,
        totalVideos,
        totalLikes,
        totalViews: totalViewsCount
    }, "User stats retrieved successfully"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { userId } = req.params;
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const videos = await Video.find({ owner: userId });

    return res.status(200).json(new ApiResponse(200, videos, "User videos retrieved successfully"));
})

export {
    getChannelStats,
    getChannelVideos
}