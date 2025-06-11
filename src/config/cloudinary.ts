import {v2 as cloudinary} from "cloudinary";
import config from "./config"
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    cloud_name: config.clodinaryCloudName,
    api_key: config.clodinaryApiKey,
    api_secret: config.clodinaryApiSecret,
})

export default cloudinary;