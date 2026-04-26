import { Server, Socket } from "socket.io";
import Message from "../models/message";
import Conversation from "../models/conversation";
import Invitation from "../models/invitation";
import User from "../models/user";

const onlineUsers: Record<string, string[]> = {};
const socketToUser: Record<string, string> = {};
const userNames: Record<string, string> = {};

const getOnlineUsernames = () =>
  Object.keys(onlineUsers).map((id) => userNames[id]).filter(Boolean);

export const handleSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {

    socket.on("join", ({ userId, username }: { userId: string; username: string }) => {
      if (!userId || !username) return;
      socket.data.userId = userId;
      socketToUser[socket.id] = userId;
      userNames[userId] = username;
      if (!onlineUsers[userId]) onlineUsers[userId] = [];
      if (!onlineUsers[userId].includes(socket.id)) onlineUsers[userId].push(socket.id);
      io.emit("online_users", getOnlineUsernames());
    });

    // ── Private message ──
    socket.on("private_message", async ({ toUserId, text }: { toUserId: string; text: string }) => {
      const fromUserId = socketToUser[socket.id];
      if (!fromUserId || !toUserId || !text?.trim()) return;
      try {
        let conversation = await Conversation.findOne({
          type: "private",
          participants: { $all: [fromUserId, toUserId], $size: 2 },
        });
        if (!conversation) {
          conversation = await Conversation.create({ type: "private", participants: [fromUserId, toUserId] });
        }
        const msg = await Message.create({ chatId: conversation._id, sender: fromUserId, text: text.trim(), status: [] });
        const populated = await msg.populate("sender", "username _id");
        await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: msg._id });
        if (onlineUsers[toUserId]) onlineUsers[toUserId].forEach((id) => io.to(id).emit("receive_private_message", populated));
        if (onlineUsers[fromUserId]) onlineUsers[fromUserId].forEach((id) => io.to(id).emit("receive_private_message", populated));
      } catch (err) {
        console.error("private_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Group message ──
    socket.on("group_message", async ({ groupId, text }: { groupId: string; text: string }) => {
      const fromUserId = socketToUser[socket.id];
      if (!fromUserId || !groupId || !text?.trim()) return;
      try {
        const conversation = await Conversation.findOne({ _id: groupId, type: "group", participants: fromUserId });
        if (!conversation) { socket.emit("error", { message: "Group not found or access denied" }); return; }
        const msg = await Message.create({ chatId: groupId, sender: fromUserId, text: text.trim(), status: [] });
        const populated = await msg.populate("sender", "username _id");
        await Conversation.findByIdAndUpdate(groupId, { lastMessage: msg._id });
        conversation.participants.forEach((participantId: any) => {
          const pid = participantId.toString();
          if (onlineUsers[pid]) onlineUsers[pid].forEach((socketId) => {
            io.to(socketId).emit("receive_group_message", { ...populated.toObject(), groupId });
          });
        });
      } catch (err) {
        console.error("group_message error:", err);
        socket.emit("error", { message: "Failed to send group message" });
      }
    });

    // ── Invitations ──
    socket.on("send_invitation", async ({ toUserId }) => {
      const senderId = socket.data.userId;
      if (!senderId || !toUserId) return;
      const receiverId = typeof toUserId === "object" ? toUserId.id : toUserId;
      try {
        const existingRecent = await Invitation.findOne({
          sender: senderId, receiver: receiverId,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
        if (existingRecent) { socket.emit("invitation:error", { message: "You can send only one invite in 24 hours" }); return; }
        const pending = await Invitation.findOne({ sender: senderId, receiver: receiverId, status: "pending" });
        if (pending) { socket.emit("invitation:error", { message: "Invite already pending" }); return; }
        const invitation = await Invitation.create({ sender: senderId, receiver: receiverId });
        if (onlineUsers[receiverId]) {
          onlineUsers[receiverId].forEach((id) => io.to(id).emit("invitation:received", invitation));
        }
      } catch (err) {
        console.error("Invite error:", err);
      }
    });

    socket.on("accept_invitation", async (invitationId) => {
      const invitation = await Invitation.findById(invitationId);
      if (!invitation) return;
      invitation.status = "accepted";
      await invitation.save();
      const conversation = await Conversation.create({
        type: "private",
        participants: [invitation.sender, invitation.receiver],
      });
      const senderSockets = onlineUsers[invitation.sender.toString()];
      const receiverSockets = onlineUsers[invitation.receiver.toString()];
      senderSockets?.forEach((id) => io.to(id).emit("invitation:accepted", { conversation }));
      receiverSockets?.forEach((id) => io.to(id).emit("invitation:accepted", { conversation }));
    });

    socket.on("reject_invitation", async (invitationId: any) => {
      const invitation: any = await Invitation.findById(invitationId);
      if (!invitation) return;
      invitation.status = "rejected";
      invitation.rejectedAt = new Date();
      await invitation.save();
      io.to(invitation.sender.toString()).emit("invitation:rejected", { invitationId });
    });

    // ── Logout — write lastSeen BEFORE socket closes ──
    socket.on("logout", async () => {
      const userId = socketToUser[socket.id];
      if (!userId) return;
      try {
        const now = new Date();
        await User.findByIdAndUpdate(userId, { lastSeen: now });
        // Broadcast to all online users so their UI updates immediately
        io.emit("user_last_seen", { userId, lastSeen: now.toISOString() });
        console.log(`lastSeen updated for ${userNames[userId]} on logout`);
      } catch (err) {
        console.error("logout lastSeen error:", err);
      }
    });

    // ── Disconnect — fallback lastSeen write ──
    socket.on("disconnect", async () => {
      const userId = socketToUser[socket.id];
      if (userId) {
        if (onlineUsers[userId]) {
          onlineUsers[userId] = onlineUsers[userId].filter((id) => id !== socket.id);
          if (onlineUsers[userId].length === 0) {
            delete onlineUsers[userId];
            delete userNames[userId];
            // Fallback: in case "logout" event wasn't emitted (tab close, network drop)
            try {
              const now = new Date();
              await User.findByIdAndUpdate(userId, { lastSeen: now });
              io.emit("user_last_seen", { userId, lastSeen: now.toISOString() });
            } catch (err) {
              console.error("disconnect lastSeen error:", err);
            }
          }
        }
        delete socketToUser[socket.id];
      }
      io.emit("online_users", getOnlineUsernames());
    });

  });
};