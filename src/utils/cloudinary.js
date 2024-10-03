import { v2 as cloudianry } from "cloudinary";
import fs from "fs"

cloudianry.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (loaclFilePath) => {
    try {
        if (!loaclFilePath) return null
        //upload on cloudinary
        const reponse = await cloudianry.uploader.upload(loaclFilePath, {
            resource_type: "auto"
        })
        //file upload successfully
        fs.unlinkSync(loaclFilePath)//remove if successfully upload
        return reponse
    } catch (error) {
        fs.unlinkSync(loaclFilePath) //remove the locally save ulpoad file as the opration failed
        return null;
    }
}
export { uploadOnCloudinary }