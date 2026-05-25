import express from "express"
import { deleteConversation, getUserConversations } from "../controllers/conversationController"
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", protect , getUserConversations);
router.delete("/:chatId", protect, deleteConversation);

export default router;