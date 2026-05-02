import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === "application/pdf";

    return {
      folder: "chat-app",
      resource_type: "raw", 
      format: isPDF ? "pdf" : undefined,
      access_mode: "public",
    };
  },
});

export const upload = multer({ storage: storage });
