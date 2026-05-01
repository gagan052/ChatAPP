import Conversation from "../models/conversation";
import Message from "../models/message";

// POST /api/groups/create
export const createGroup = async (req:any, res:any) => {
  try {
    const { name, memberIds } = req.body;
    const adminId = req.user.id; 

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    if (!memberIds || memberIds.length < 1) {
      return res.status(400).json({ success: false, message: "Add at least one member" });
    }

  
    const participants = [...new Set([adminId, ...memberIds])];

    const group = await Conversation.create({
      type: "group",
      participants,
      groupInfo: {
        name: name.trim(),
        admin: adminId,
      },
    });

    const populated = await group.populate("participants", "username _id profilePic").populate("groupInfo.admin", "username _id profilePic");

    res.json({ success: true, group: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/groups 
export const getGroups = async (req:any, res:any) => {
  try {
    const userId = req.user.id;

    const groups = await Conversation.find({
      type: "group",
      participants: userId,
    })
      .populate("participants", "username _id profilePic")
      .populate("lastMessage", "text fileUrl fileType sender createdAt")
      .populate("groupInfo.admin", "username _id profilePic")
      .sort({ updatedAt: -1 });

    res.json({ success: true, groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/groups/:groupId/messages

export const getGroupMessages = async (req:any, res:any) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({ chatId: groupId })
      .populate("sender", "username _id profilePic")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/groups/:groupId/update
export const updateGroup = async (req:any, res:any) => {
  try {
    const { groupId } = req.params;
    const { name, avatar } = req.body;
    const userId = req.user.id;

    const group = await Conversation.findOne({
      _id: groupId,
      type: "group",
      participants: userId,
    });

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const adminId = group.groupInfo?.admin;
    if (!adminId || adminId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only admin can update group info" });
    }

    if (name?.trim()) {
      group.groupInfo.name = name.trim();
    }

    if (avatar) {
      group.groupInfo.avatar = avatar;
    }

    await group.save();
    const populated = await group.populate("participants", "username _id profilePic").populate("groupInfo.admin", "username _id profilePic");

    res.json({ success: true, group: populated });
  } catch (err) {
    console.error("updateGroup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};