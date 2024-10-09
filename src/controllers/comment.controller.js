import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    const comment = await Comment.aggregate([
        {
            $match: { videoId: mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: "_id",
                as: 'userDetails'
            }

        },
        {
            $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }
        },
        {
            $project: {
                content: 1,
                'userDetails.username': 1
            }


        }
        ,
        {
            $skip: (page - 1) * limit // Stage 5: Implement pagination by skipping documents
        },
        {
            $limit: limit // Stage 6: Limit the number of documents returned
        }
    ])

    return res.status(200).json(new ApiResponse(200, comment, "video comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const { videoId } = req.params
    if (!content || !videoId) {
        new ApiError(400, "Content and video ID are required")
    }
    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId

    })

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    // will req commend id form params
    //then req contemt form body
    //then use find by id and update and return res
    const { commentId } = req.params
    const { content } = req.body
    if (!commentId || !content) {
        throw new ApiError(400, "commedId or content is missing")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )
    if (!updatedComment) {
        throw new ApiError(404, "comment not found ")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "comment updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    //find id from params
    //then use find by id and delete
    //return the response

    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError(400, "comment id is missing")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
        throw new ApiError(404, "commetn not found")

    }

    return res
        .status(200)
        .json(200, {}, "comment deleted successfully")
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}