import express from "express";
import { protect } from "../middlewares/authMiddleware";
import {
  sendInvitation,
  acceptInvitation,
  rejectInvitation,
  getPendingInvitations,
  getInvitationStatus,
} from "../controllers/invitationController";

const router = express.Router();

router.post("/send", protect, sendInvitation);
router.post("/accept", protect, acceptInvitation);
router.post("/reject", protect, rejectInvitation);
router.get("/pending", protect, getPendingInvitations);
router.get("/status/:receiverId", protect, getInvitationStatus);

export default router;