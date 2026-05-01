import express from "express"
import { createGroup, getGroups, getGroupMessages, updateGroup } from "../controllers/groupController"
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(protect);

router.post("/create", createGroup);
router.get("/", getGroups);
router.get("/:groupId/messages", getGroupMessages);
router.put("/:groupId/update", updateGroup);

export default router;