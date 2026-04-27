
import Conversation from "../models/conversation";

export const getUserConversations = async (req:any, res:any) => {
  try {
    const userId = req.user.id;
 
    const conversations = await Conversation.find({
      type: "private",
      participants: userId,
    })
      .populate("participants", "username _id lastSeen")
      .populate("lastMessage", "text createdAt sender")
      .sort({ updatedAt: -1 });
 
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};