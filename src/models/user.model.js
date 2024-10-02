import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
const UserSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true //for searching purposes
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,

    },
    fullname: {
        type: String,
        required: true,

        lowercase: true,
        trim: true,
        index: true //for searching purposes
    },
    avatar: {
        type: String, //cloudianry url or aws bucket
        required: true,

    },
    coverImage: {
        type: String, //cloudianry url or aws bucket


    },
    watchHistory: [
        {
            types: Schema.Types.ObjectId,
            ref: "Video"
        }

    ],
    password: {
        type: String,
        required: [true, 'Password Is Required']
    },
    refreshToken: {
        type: String
    },

}, { timestamps: true })

//encrypting password
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); //if password feild is not modified
    this.password = await bcrypt.hash(this.password, 10)
    next();
})

// password check
UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

//token genration
UserSchema.methods.genrateAcessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACESS_TOKEN_EXPIRY
        }
    )
}

//refresh token
UserSchema.methods.genrateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", UserSchema)