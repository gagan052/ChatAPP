import express from "express";
import User from "../models/user";
import Conversation from "../models/conversation";
import Invitation from "../models/invitation";
import { upload } from "../middlewares/upload";
import { protect } from "../middlewares/authMiddleware";
import cloudinary from "../config/cloudinary";

const router = express.Router();

const handleSingleUpload =
  (fieldName: string) => (req: any, res: any, next: any) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        console.error("UPLOAD MIDDLEWARE ERROR:", err);
        return res.status(500).json({
          message:"File upload failed",
        });
      }
      return next();
    });
  };

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("_id username profilePic");
    res.json(
      users.map((u) => ({
        id: u._id,
        username: u.username,
        profilePic: u.profilePic,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/search", async (req: any, res: any) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user?.id;

    if (!q || !currentUserId) {
      return res.json([]);
    }

    const users = await User.find({
      username: { $regex: q, $options: "i" },
    }).select("_id username profilePic");

    const results: any[] = [];

    for (const user of users) {
      if (String(user._id) === String(currentUserId)) continue;

      const privateConversation = await Conversation.findOne({
        participants: { $all: [currentUserId, user._id] },
        type: "private",
      });

      if (privateConversation) continue;

      let inviteStatus = "none";

      const existing = await Invitation.findOne({
        sender: currentUserId,
        receiver: user._id,
      });

      if (existing) {
        if (existing.status === "pending") {
          inviteStatus = "pending";
        } else if (existing.status === "rejected" && existing.rejectedAt) {
          const hoursPassed =
            (Date.now() - new Date(existing.rejectedAt).getTime()) /
            (1000 * 60 * 60);

          if (hoursPassed < 24) {
            inviteStatus = "cooldown";
          }
        }
      }

      results.push({
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
        inviteStatus,
      });
    }

    res.json(results);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/upload-profile",
  protect,
  handleSingleUpload("image"),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      const user: any = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.profilePic) {
        const publicId = user.profilePic
          .split("/")
          .pop()
          ?.split(".")
          .slice(0, -1)
          .join(".");

        if (publicId) {
          await cloudinary.uploader.destroy(`chat-app/${publicId}`);
        }
      }

      user.profilePic = req.file.path; // cloudinary URL
      await user.save();

      return res.json({ profilePic: user.profilePic });
    } catch (err: any) {
      console.error("UPLOAD PROFILE ERROR:", err);
      return res
        .status(500)
        .json({ message: err?.message || "Failed to upload profile picture" });
    }
  }
);

router.post(
  "/upload-file",
  protect,
  handleSingleUpload("file"),
  async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.json({
      url: req.file.path,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });
  }
);

export default router;
