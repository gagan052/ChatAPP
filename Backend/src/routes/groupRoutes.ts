import express from "express";
import {
  createGroup,
  getGroups,
  getGroupMessages,
  updateGroup,
  deleteGroup,
  removeMemberFromGroup,
} from "../controllers/groupController";

const router = express.Router();

router.post("/create", createGroup);
router.get("/", getGroups);
router.delete("/:groupId/members/:memberId", removeMemberFromGroup);
router.delete("/:groupId", deleteGroup);
router.get("/:groupId/messages", getGroupMessages);
router.put("/:groupId/update", updateGroup);

export default router;