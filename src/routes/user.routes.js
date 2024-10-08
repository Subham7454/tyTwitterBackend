import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    getUserChnnelProfile,
    updatedAccountDetails,
    updatedAvatar,
    updatedCoverImage,
    getWatchHistory,
    refreshAccessToken

} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([ //middleware injection
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refreshToken").post(refreshAccessToken)//no need middleware coz we have write in controller
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updatedAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updatedAvatar)
router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updatedCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChnnelProfile)
router.route("/watched-history").get(verifyJWT, getWatchHistory)

export default router


