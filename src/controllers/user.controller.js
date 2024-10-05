import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken"
import { response } from "express";

// Updated token generation function
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar");
    }

    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
    const logedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,  // Fix typo
        secure: process.env.NODE_ENV === "production",  // Only secure in production
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: logedInUser, accessToken, refreshToken }, "User login successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined }, { new: true });

    const options = {
        httpOnly: true, // Fix typo
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});


//endpoint for refresh accesstoken

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorizes request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken != user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")

        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newrefreshToken } = await generateAccessAndRefereshTokens(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200, { accessToken, refreshToken: newrefreshToken },
                    "access tokoen refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { odlPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await User.isPasswordCorrect(odlPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid old password")
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "password updated"))
})

const getCurrentUser = asyncHandler((req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "user fetched successfully"));
})

const updatedAccountDetails = asyncHandler(async (req, res) => {

    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(404, "All fields are required");
    }


    const user = await User.findByIdAndUpdate(

        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }

        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "account details updated successfully"))
})

const updatedAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file not found");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar")

    }
    // Extract public ID from the current avatar URL if it exists
    const currentAvatarUrl = user.avatar.url;
    const publicId = currentAvatarUrl?.split("/").pop().split(".")[0]; // Extracts the public ID from the URL

    // Delete the current avatar from Cloudinary (if it exists)
    if (publicId) {
        await deleteFromCloudinary(publicId);
    }



    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url }
        }, {
        new: true
    }


    ).select("-password")

    return response
        .status(200).json(
            new ApiResponse(200, user, "avatar updated successfully")
        )
})

const updatedCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file not found");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "error while uploading avatar")

    }
    // Extract public ID from the current avatar URL if it exists
    const currentCoverImageUrl = user.coverImage.url;
    const publicId = currentCoverImageUrl?.split("/").pop().split(".")[0]; // Extracts the public ID from the URL

    // Delete the current avatar from Cloudinary (if it exists)
    if (publicId) {
        await deleteFromCloudinary(publicId);
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url }
        }, {
        new: true
    }


    ).select("-password")

    return response
        .status(200).json(
            new ApiResponse(200, user, "coverImage updated successfully")
        )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updatedAccountDetails,
    updatedAvatar,
    updatedCoverImage
};
