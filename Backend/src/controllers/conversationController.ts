import Message from "../models/message";
import Conversation from "../models/conversation";

export const getUserConversations = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      type: "private",
      participants: userId,
    })
      .populate("participants", "username _id lastSeen profilePic")
      .populate("lastMessage", "text fileUrl fileType createdAt sender")
      .sort({ updatedAt: -1 });

    res.json(conversations);
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
      return res.status(404).json({ message: "Conversation not found" });
    }

    //  Security check (user must be part of chat)
    if (
      !conversation.participants.some((p: any) => String(p) === String(userId))
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    //  Delete all messages of this chat
    await Message.deleteMany({ chatId });

    //  Delete conversation
    await Conversation.findByIdAndDelete(chatId);

    req.app.get("io").emit("chat:deleted", { chatId });

    res.json({ success: true, message: "Chat deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete chat" });
  }
};
