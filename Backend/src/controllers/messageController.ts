import Message from "../models/message";
import Conversation from "../models/conversation";

export const getMessages = async (req:any, res:any) => {
  const { user1, user2 } = req.params;

  try {
    // Find the private conversation between the two users
    const conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [user1, user2], $size: 2 },
    });

    if (!conversation) {
      return res.json([]); // No conversation yet, return empty
    }

    const messages = await Message.find({ chatId: conversation._id }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};