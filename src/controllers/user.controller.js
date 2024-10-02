import asyncHandler from "../utils/asycnHandler.js"

const registerUser = asyncHandler(async (req, res) => {
    console.log('POST /register called');  // To check if route is hit
    res.status(200).json({
        message: "ok"

    })


})

export { registerUser }