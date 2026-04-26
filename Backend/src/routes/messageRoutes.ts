import express from "express";
import { getMessages, updateMessage, deleteMessage, clearChat } from "../controllers/messageController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/:user1/:user2", getMessages);
router.put("/:messageId", protect, updateMessage);
router.delete("/:messageId", protect, deleteMessage);
router.delete("/clear/:chatId", protect, clearChat);

export default router;
