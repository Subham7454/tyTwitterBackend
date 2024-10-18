
import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;


    const filters = {};


    if (userId) {
        filters.owner = userId;
    }


    if (query) {
        filters.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortType === 'asc' ? 1 : -1;


    const skip = (page - 1) * limit;

    const videos = await Video.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('owner', 'name email');


    const totalVideos = await Video.countDocuments(filters);


    res.status(200).json(new ApiResponse(200, {
        videos,
        pagination: {
            totalVideos,
            currentPage: page,
            totalPages: Math.ceil(totalVideos / limit),
            limit: limit
        }
    }, "Videos fetched successfully"));


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { tittle, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    const user = req.user;
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "video is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail  is required")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if (!videoFile) {
        throw new ApiError(400, "failed to upload video");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(400, "failed to upload thubnail");
    }


    const video = await Video.create({
        tittle,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        owner: user._id


    })

    return res.status(200).json(new ApiResponse(200, video, "vedio published sucessfully"))

})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId).populate('owner', 'name email'); // Assuming owner has name and email

    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json(new ApiResponse(200, video, "vedio get sucessfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const user = req.user;


    //TODO: update video details like title, description, thumbnail
    const { description, title } = req.body;

    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(200, "thubmnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
        throw new ApiError(400, "error while uploading thumbnail")
    }

    const currentThumbnailUrl = thumbnail.url
    const punlicId = currentThumbnailUrl?.split("/").pop().split(".")[0];
    if (punlicId) {
        await deleteFromCloudinary(punlicId)
    }
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (thumbnail.url) updateFields.thumbnail = thumbnail.url;

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        { new: true }
    );
    return res
        .status(200).json(
            new ApiResponse(200, video, "video  details updated successfully")
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    const videoFileUrl = video.videoFile;
    const publicId = videoFileUrl.split("/").pop().split(".")[0];
    if (publicId) {
        await deleteFromCloudinary(publicId);
    }

    await Video.findByIdAndDelete(videoId);

    res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    await video.save();

    res.status(200).json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}