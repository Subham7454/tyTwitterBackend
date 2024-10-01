import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({
    extended: true, limit: "16kb"//this url encoced helps when data comes from a url eg:www.shibma+rawat+dot+com
}))
app.use(express.static("public"))
app.use(cookieParser())
export default app
