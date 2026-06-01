import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: any) => {
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    
    return {
      folder: "chat-app",
      resource_type: "auto", // Let Cloudinary decide, but we force flags next
      flags: isPdf ? "inline" : undefined,
      format: isPdf ? "pdf" : undefined,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
    };
  }
});

export const upload = multer({ storage });