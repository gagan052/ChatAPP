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

export const updateMessage = async (req: any, res: any) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    message.text = text;
    message.isEdited = true; // Add isEdited field to model if not exists
    await message.save();

    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update message" });
  }
};

export const deleteMessage = async (req: any, res: any) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
};

export const clearChat = async (req: any, res: any) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  try {
    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await Message.deleteMany({ chatId });
    await Conversation.findByIdAndUpdate(chatId, { lastMessage: null });

    res.json({ success: true, message: "Chat cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to clear chat" });
  }
};