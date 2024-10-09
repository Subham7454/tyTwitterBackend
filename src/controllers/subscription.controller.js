import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { subscription, Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    //get subsciber id
    //find both subscriber id and channel id
    //if present delete subscription if not present add
    //return resposne
    const { subscriberId } = req.user._id

    if (!channelId || !subscriberId) {
        throw new ApiError(400, "channelId and subscriberId are required")
    }

    const existedSubscription = await Subscription.findOne({ subscriber: subscriberId, channel: channelId })
    if (existedSubscription) {
        await subscription.deleteOne({ _id: existedSubscription.id })
        return res.staus(200).json(new ApiResponse(200, {}, "unsubscribed successfully"))
    }
    else {
        const newSubscription = await subscription.create({ subscriber: subscriberId, channel: channelId })
        return res.status(200).json(new ApiResponse(200, newSubscription, "subscribed successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(400, "channelId is required")
    }

    const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", 'username')

    if (!subscribers) {
        throw new ApiError(404, "subscribers not found")
    }
    return res.status(200).json(new ApiResponse(200, subscribers, "subscribers found"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate('channel', 'username');

    return res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels retrieved successfully."));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}