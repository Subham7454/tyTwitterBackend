import asyncHandler from "../utils/asycnHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const genrateAccessAndRefreshToken = async (userId) => {
    try {
        const user = User.findById(userId)
        const accessToken = user.genrateAcessToken()
        const refreshToken = user.genrateRefreshToken()
        user.refreshToken = refreshToken //adding in databse
        await user.save({ validateBeforeSave: false })//save data in db whithout validate

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while genrating refresh and sccess token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;


    // Validate required fields
    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    // If user already exists, throw an error
    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    // File paths for avatar and cover image
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // Check for avatar
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // Upload avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar");
    }

    // Upload cover image if it exists
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    // Create user object in DB
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // If present then add otherwise ignore (corner case)
        email,
        password,
        username: username.toLowerCase()
    });

    // Check if user creation was successful
    const createdUser = await User.findById(user._id).select("-password -refreshToken"); // Exclude password and refreshToken

    // If user creation failed, throw an error
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Return success response
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    //body se req data
    //username or email hai ya ni
    //find user
    //password check
    //access and refresh token genration and send to user
    //send cookie
    //response

    const { email, username, password } = req.body
    if (!username && !email) {
        throw new ApiError(400, "username or email required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user doesnot exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "password is incorrect")
    }
    const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(user._id)
    const logedInUser = await User.findById(user._id).select("-password -refreshToken")

    //setting up cookies

    const options = {
        htppOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: logedInUser, accessToken, refreshToken
            },
                "user login successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        htppOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Loged Out"))



})

export { registerUser, loginUser, logoutUser };
