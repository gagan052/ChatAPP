import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
  let resourceType = "auto";

  if (file.mimetype.startsWith("image/")) {
    resourceType = "image";
  } else if (file.mimetype.startsWith("video/")) {
    resourceType = "video";
  } else {
    resourceType = "raw";
  }

  return {
    folder: "chat-app",
    resource_type: resourceType,
  };
}
});

export const upload = multer({ storage });