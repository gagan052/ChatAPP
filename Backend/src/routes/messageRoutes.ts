import express from "express";
import { getMessages, updateMessage, deleteMessage, clearChat } from "../controllers/messageController";
import { protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/upload";

const router = express.Router();

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
