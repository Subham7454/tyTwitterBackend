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
            type: Schema.Types.ObjectId,
            ref: 'Video'
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
// Access token
UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,  // Note the corrected spelling
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY // Note the corrected spelling
        }
    );
};

// Refresh token
UserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

export const User = mongoose.model("User", UserSchema);
