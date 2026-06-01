import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file: any) => {
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    
    return {
      folder: "chat-app",
      // Force 'image' for PDFs to enable browser-inline viewing
      resource_type: isPdf ? "image" : "auto", 
      // Force format to 'pdf' so Cloudinary provides the correct MIME type headers
      format: isPdf ? "pdf" : undefined,
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
    };
  }
});

export const upload = multer({ storage });