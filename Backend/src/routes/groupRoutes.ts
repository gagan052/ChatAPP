import express from "express";
import { createGroup, getGroups, getGroupMessages } from "../controllers/groupController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(protect);

router.post("/create", createGroup);
router.get("/", getGroups);
router.get("/:groupId/messages", getGroupMessages);

export default router;