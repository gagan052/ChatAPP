import express from "express";
import User from "../models/user";
import Conversation from "../models/conversation";
import Invitation from "../models/invitation";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("_id username");
    res.json(users.map((u) => ({ id: u._id, username: u.username })));
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
    }).select("_id username");

    const results = [];

    for (const user of users) {
      // skip self
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
        inviteStatus,
      });
    }

    res.json(results);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
