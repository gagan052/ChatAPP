import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat-app",
    resource_type: "auto", // images + files
  },
});

export const upload = multer({ storage });
