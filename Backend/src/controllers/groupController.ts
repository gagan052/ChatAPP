import { Request } from "express";
import type { Server } from "socket.io";
import Conversation from "../models/conversation";
import Message from "../models/message";
import { notifyUserSockets } from "../sockets/socketHandler";

function getIo(req: Request): Server | undefined {
  return req.app.get("io") as Server | undefined;
}

/** Mongoose may leave admin as ObjectId or populate it to { _id, ... }. */
export function normalizeAdminId(admin: unknown): string | null {
  if (admin == null) return null;
  if (
    typeof admin === "object" &&
    admin !== null &&
    "_id" in admin &&
    (admin as { _id: unknown })._id != null
  ) {
    return String((admin as { _id: unknown })._id);
  }
  return String(admin);
}

async function populateGroup(group: InstanceType<typeof Conversation>) {
  return group.populate([
    { path: "participants", select: "username _id profilePic" },
    { path: "groupInfo.admin", select: "username _id profilePic" },
    {
      path: "lastMessage",
      select: "text fileUrl fileType sender createdAt",
    },
  ]);
}

// POST /api/groups/create
export const createGroup = async (req: any, res: any) => {
  try {
    const { name, memberIds } = req.body;
    const adminId = req.user.id;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Group name is required" });
    }

    if (!memberIds || memberIds.length < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Add at least one member" });
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

    const populated = await populateGroup(group);

    res.json({ success: true, group: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/groups
export const getGroups = async (req: any, res: any) => {
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

export const getGroupMessages = async (req: any, res: any) => {
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
export const updateGroup = async (req: any, res: any) => {
  try {
    const { groupId } = req.params;
    const { name, avatar } = req.body;
    const userId = String(req.user.id);

    const group = await Conversation.findOne({
      _id: groupId,
      type: "group",
      participants: userId,
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const adminId = normalizeAdminId(group.groupInfo?.admin);
    if (!adminId || adminId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Only admin can update group info" });
    }

    if (name?.trim()) {
      group.groupInfo.name = name.trim();
    }

    if (avatar !== undefined && avatar !== null && avatar !== "") {
      group.groupInfo.avatar = avatar;
    }

    await group.save();
    const populated = await populateGroup(group);

    const io = getIo(req);
    if (io) {
      const recipientIds = populated.participants.map((p: any) =>
        String(p._id)
      );
      notifyUserSockets(io, recipientIds, "group:updated", {
        group: populated,
      });
    }

    res.json({ success: true, group: populated });
  } catch (err) {
    console.error("updateGroup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/groups/:groupId/members/:memberId
export const removeMemberFromGroup = async (req: any, res: any) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = String(req.user.id);

    const group = await Conversation.findOne({
      _id: groupId,
      type: "group",
      participants: userId,
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const adminId = normalizeAdminId(group.groupInfo?.admin);
    if (!adminId || adminId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only admin can remove members",
      });
    }

    if (String(memberId) === adminId) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the admin from the group",
      });
    }

    const participantStrings = group.participants.map((p: any) =>
      String(p)
    );
    if (!participantStrings.includes(String(memberId))) {
      return res.status(404).json({
        success: false,
        message: "User is not in this group",
      });
    }

    group.participants = group.participants.filter(
      (p: any) => String(p) !== String(memberId)
    );
    await group.save();

    const populated = await populateGroup(group);

    const io = getIo(req);
    if (io) {
      const remainingIds = populated.participants.map((p: any) =>
        String(p._id)
      );
      notifyUserSockets(io, remainingIds, "group:updated", {
        group: populated,
      });
      notifyUserSockets(io, [String(memberId)], "group:removed_from", {
        groupId: String(groupId),
      });
    }

    res.json({ success: true, group: populated });
  } catch (err) {
    console.error("removeMemberFromGroup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/groups/:groupId
export const deleteGroup = async (req: any, res: any) => {
  try {
    const { groupId } = req.params;
    const userId = String(req.user.id);

    const group = await Conversation.findOne({
      _id: groupId,
      type: "group",
      participants: userId,
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const adminId = normalizeAdminId(group.groupInfo?.admin);
    if (!adminId || adminId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete the group",
      });
    }

    const participantIds = group.participants.map((p: any) => String(p));

    await Message.deleteMany({ chatId: groupId });
    await Conversation.findByIdAndDelete(groupId);

    const io = getIo(req);
    if (io) {
      notifyUserSockets(io, participantIds, "group:deleted", {
        groupId: String(groupId),
      });
    }

    res.json({ success: true, message: "Group deleted" });
  } catch (err) {
    console.error("deleteGroup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
