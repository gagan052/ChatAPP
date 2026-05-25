import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();
cloudinary.config(true);

const cloud_name = process.env.CLOUD_NAME ;
const api_key = process.env.CLOUD_API_KEY ;
const api_secret = process.env.CLOUD_API_SECRET ;

const overrides: Record<string, string> = {};

if (cloud_name) overrides.cloud_name = cloud_name;
if (api_key) overrides.api_key = api_key;
if (api_secret) overrides.api_secret = api_secret;

if (Object.keys(overrides).length > 0) {
  cloudinary.config(overrides);
}

export default cloudinary;
