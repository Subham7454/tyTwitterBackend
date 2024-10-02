import asyncHandler from "../utils/asycnHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    //validation -not empty
    //check if user already exist :username ,eamil
    //files =avatr ,coveriamge
    //upload them to cloudinary,avatar
    //create user object-crerate entry in db
    //remove pass and refresh token feild
    //check for user creation
    //return response

    const { fullName, email, username, password } = req.body
    console.log(email, fullName, username, password)

    /*if (fullName === "") {
        throw new ApiError(400,"fullname is required")
    }  or we can write this like below*/

    if (
        [fullName, email, username, password].some((feild) => feild?.trim() === "")
    ) {
        throw new ApiError(400, "all feils are required")

    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "user with email or suername already exits")

    }


    const avatarLocalPath = req.files?.avatar[0]?.path //to get path
    const coveriamgeLocalPath = req.files?.avatar[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coveriamge = await uploadOnCloudinary(coveriamgeLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coveriamge: coveriamge?.url || "", //if present then add otherwise ognore(corner case)
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //excluding these two
    )

    if (createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")

    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )
})

export { registerUser }