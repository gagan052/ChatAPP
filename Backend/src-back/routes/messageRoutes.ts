import express from "express";
import { Readable } from "stream";
import { getMessages, updateMessage, deleteMessage, clearChat } from "../controllers/messageController";
import { protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = express.Router();

// Cloudinary stores PDFs on this account as "raw" resources (the "image" pipeline
// is restricted for PDF/ZIP delivery), and raw delivery always forces
// Content-Disposition: attachment with no URL flag to override it. This proxies
// the file through our server so it can open inline in the browser instead.
router.get("/file-proxy", protect, async (req: any, res) => {
  try {
    const { url, name } = req.query as { url?: string; name?: string };
    if (!url) {
      return res.status(400).json({ message: "Missing url" });
    }

    const cloudName = process.env.CLOUD_NAME;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ message: "Invalid url" });
    }

    if (
      parsed.hostname !== "res.cloudinary.com" ||
      !cloudName ||
      !parsed.pathname.startsWith(`/${cloudName}/`)
    ) {
      return res.status(400).json({ message: "Invalid file url" });
    }

    const upstream = await fetch(parsed.toString());
    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status).json({ message: "File not found" });
    }

    const safeName = (name || "file.pdf").replace(/[^\w.\- ]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);

    Readable.fromWeb(upstream.body as any).pipe(res);
  } catch (err) {
    console.error("file-proxy error:", err);
    res.status(500).json({ message: "Failed to load file" });
  }
});

router.get("/:user1/:user2", getMessages);
router.put("/:messageId", protect, updateMessage);
router.delete("/:messageId", protect, deleteMessage);
router.delete("/clear/:chatId", protect, clearChat);

router.post("/upload", protect, upload.single("file"), async (req: any, res) => {
  try {

    res.json({
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
