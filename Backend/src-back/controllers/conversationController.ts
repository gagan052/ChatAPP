import Message from "../models/message";
import Conversation from "../models/conversation";
import { redis } from "../config/redis";
import chalk from "chalk";

export const getUserConversations = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const cacheKey = `chat:list:${userId}`;

    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(chalk.blue("Redis hit for user conversations"));

      try {
        return res.json(cached);
      } catch (err) {
        console.log("Invalid cache detected");

        await redis.del(cacheKey);
      }
    }

    console.log(chalk.red("Mongo hit for user conversations"));

    const conversations = await Conversation.find({
      type: "private",
      participants: userId,
    })
      .populate("participants", "username _id lastSeen profilePic")
      .populate("lastMessage", "text fileUrl fileType createdAt sender")
      .sort({ updatedAt: -1 });

    // console.log(
    //   conversations[0].participants.map((p: any) => ({
    //     username: p.username,
    //     profilePic: p.profilePic,
    //   }))
    // );

    // 3. Transform into frontend-ready shape
    const mapped = conversations
      .map((conv: any) => {
        const other = conv.participants.find(
          (p: any) => String(p._id) !== String(userId)
        );

        // console.log("OTHER USER:", other);

        if (!other) return null;

        return {
          id: other._id,
          username: other.username,
          lastSeen: other.lastSeen,
          profilePic: other.profilePic,
          lastMessage: conv.lastMessage?.text || "",
          lastMessageFileUrl: conv.lastMessage?.fileUrl || null,
          lastMessageFileType: conv.lastMessage?.fileType || null,
          chatId: conv._id,
        };
      })
      .filter(Boolean);

    // console.log("Mapped conversations:");
    // console.dir(mapped, { depth: null });

    // 4. Cache
    await redis.set(cacheKey, mapped, {
      ex: 300,
    });

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteConversation = async (req: any, res: any) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(chatId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (p: any) => String(p) === String(userId)
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await Message.deleteMany({ chatId });

    await Conversation.findByIdAndDelete(chatId);

    // invalidate cache
    await Promise.all(
      conversation.participants.map((participant: any) =>
        redis.del(`chat:list:${participant}`)
      )
    );

    req.app.get("io").emit("chat:deleted", { chatId });

    res.json({
      success: true,
      message: "Chat deleted",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete chat",
    });
  }
};
