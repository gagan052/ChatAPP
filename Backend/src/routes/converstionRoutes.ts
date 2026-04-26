import express from "express"
import { getUserConversations } from "../controllers/conversationController"
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", protect , getUserConversations);

export default router;