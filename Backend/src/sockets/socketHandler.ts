import { Server, Socket } from "socket.io";
import Message from "../models/message";
import Conversation from "../models/conversation";
import Invitation from "../models/invitation";
import User from "../models/user";

const onlineUsers: Record<string, string[]> = {};
const socketToUser: Record<string, string> = {};
const userNames: Record<string, string> = {};

const getOnlineUsernames = () =>
  Object.keys(onlineUsers)
    .map((id) => userNames[id])
    .filter(Boolean);

/** Notify all socket tabs for each user id (works with existing onlineUsers map). */
export const notifyUserSockets = (
  io: Server,
  userIds: string[],
  event: string,
  payload: unknown
) => {
  userIds.forEach((uid) => {
    onlineUsers[uid]?.forEach((sid) => io.to(sid).emit(event, payload));
  });
};

export const handleSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    socket.on(
      "join",
      ({ userId, username }: { userId: string; username: string }) => {
        if (!userId || !username) return;
        socket.data.userId = userId;
        socketToUser[socket.id] = userId;
        userNames[userId] = username;
        if (!onlineUsers[userId]) onlineUsers[userId] = [];
        if (!onlineUsers[userId].includes(socket.id))
          onlineUsers[userId].push(socket.id);
        io.emit("online_users", getOnlineUsernames());
      }
    );

    // ── Private message ──
    socket.on(
      "private_message",
      async ({
        toUserId,
        text,
        fileUrl,
        fileType,
        fileName,
        fileSize,
      }: {
        toUserId: string;
        text?: string;
        fileUrl?: string;
        fileType?: string;
        fileName?: string;
        fileSize?: number;
      }) => {
        const fromUserId = socketToUser[socket.id];

        if (!fromUserId || !toUserId) return;

        // must have at least text OR file
        if (!text?.trim() && !fileUrl) return;

        try {
          let conversation = await Conversation.findOne({
            type: "private",
            participants: { $all: [fromUserId, toUserId], $size: 2 },
          });
          if (!conversation) {
            conversation = await Conversation.create({
              type: "private",
              participants: [fromUserId, toUserId],
            });
          }

          console.log("SENDING MESSAGE:", {
            fromUserId,
            toUserId,
          });

          const msg = await Message.create({
            chatId: conversation._id,
            sender: fromUserId,
            text: text?.trim() || "",
            fileUrl: fileUrl || null,
            fileType: fileType || null,
            fileName: fileName || null,
            fileSize: fileSize || null,
            status: [
              {
                userId: fromUserId,
                delivered: new Date(),
              },
              {
                userId: toUserId,
                delivered: onlineUsers[toUserId] ? new Date() : null,
              },
            ],
          });

          const updatedMsg = await Message.findById(msg._id).populate(
            "sender",
            "username _id"
          );

          await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: msg._id,
          });
          if (onlineUsers[toUserId])
            onlineUsers[toUserId].forEach((id) =>
              io.to(id).emit("receive_private_message", updatedMsg)
            );
          if (onlineUsers[fromUserId])
            onlineUsers[fromUserId].forEach((id) =>
              io.to(id).emit("receive_private_message", updatedMsg)
            );
        } catch (err) {
          console.error("private_message error:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    socket.on("mark_seen", async ({ chatId, userId }) => {
      try {
        const messages = await Message.find({
          chatId,
          sender: { $ne: userId },
          "status.userId": userId,
          "status.seen": null,
        });

        if (messages.length > 0) {
          const messageIds = messages.map((m) => m._id);
          await Message.updateMany(
            { _id: { $in: messageIds } },
            {
              $set: {
                "status.$[elem].seen": new Date(),
              },
            },
            {
              arrayFilters: [{ "elem.userId": userId }],
            }
          );

          io.to(chatId).emit("messages_seen", {
            messageIds,
            chatId,
            userId,
            seenAt: new Date(),
          });
        }
      } catch (err) {
        console.error("mark_seen error:", err);
      }
    });

    socket.on("join_chat", (chatId: string) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    socket.on(
      "edit_message",
      async ({
        messageId,
        text,
        toUserId,
        isGroup,
      }: {
        messageId: string;
        text: string;
        toUserId?: string;
        isGroup?: boolean;
      }) => {
        const userId = socketToUser[socket.id];
        if (!userId || !messageId || !text?.trim()) return;

        try {
          const message = await Message.findById(messageId);
          if (!message || message.sender.toString() !== userId) return;

          message.text = text.trim();
          message.isEdited = true;
          await message.save();

          const populated = await message.populate("sender", "username _id");

          if (isGroup && message.chatId) {
            const conversation = await Conversation.findById(message.chatId);
            conversation?.participants.forEach((pId: any) => {
              const pid = pId.toString();
              onlineUsers[pid]?.forEach((sid) =>
                io.to(sid).emit("message:updated", populated)
              );
            });
          } else if (toUserId) {
            onlineUsers[toUserId]?.forEach((sid) =>
              io.to(sid).emit("message:updated", populated)
            );
            onlineUsers[userId]?.forEach((sid) =>
              io.to(sid).emit("message:updated", populated)
            );
          }
        } catch (err) {
          console.error("edit_message error:", err);
        }
      }
    );

    socket.on(
      "delete_message",
      async ({
        messageId,
        toUserId,
        isGroup,
      }: {
        messageId: string;
        toUserId?: string;
        isGroup?: boolean;
      }) => {
        const userId = socketToUser[socket.id];
        if (!userId || !messageId) return;

        try {
          const message = await Message.findById(messageId);
          if (!message || message.sender.toString() !== userId) return;

          const chatId = message.chatId;
          await Message.findByIdAndDelete(messageId);

          //  Update lastMessage to the new latest after deletion
          const latestMsg = await Message.findOne({ chatId }).sort({
            createdAt: -1,
          });
          await Conversation.findByIdAndUpdate(chatId, {
            lastMessage: latestMsg?._id ?? null,
          });

          const payload = {
            messageId,
            chatId,
            newLastMessage: latestMsg?.text ?? "",
            newLastMessageFileUrl: latestMsg?.fileUrl ?? null,
            newLastMessageFileType: latestMsg?.fileType ?? null,
          };

          if (isGroup && chatId) {
            const conversation = await Conversation.findById(chatId);
            conversation?.participants.forEach((pId: any) => {
              const pid = pId.toString();
              onlineUsers[pid]?.forEach((sid) =>
                io.to(sid).emit("message:deleted", payload)
              );
            });
          } else if (toUserId) {
            onlineUsers[toUserId]?.forEach((sid) =>
              io.to(sid).emit("message:deleted", payload)
            );
            onlineUsers[userId]?.forEach((sid) =>
              io.to(sid).emit("message:deleted", payload)
            );
          }
        } catch (err) {
          console.error("delete_message error:", err);
        }
      }
    );

    socket.on(
      "clear_chat",
      async ({
        chatId,
        toUserId,
        isGroup,
      }: {
        chatId: string;
        toUserId?: string;
        isGroup?: boolean;
      }) => {
        const userId = socketToUser[socket.id];
        if (!userId || !chatId) return;

        try {
          const conversation = await Conversation.findById(chatId);
          if (!conversation) return;

          const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId
          );
          if (!isParticipant) return;

          await Message.deleteMany({ chatId });
          await Conversation.findByIdAndUpdate(chatId, { lastMessage: null });

          if (isGroup) {
            conversation.participants.forEach((pId: any) => {
              const pid = pId.toString();
              onlineUsers[pid]?.forEach((sid) =>
                io.to(sid).emit("chat:cleared", { chatId })
              );
            });
          } else if (toUserId) {
            onlineUsers[toUserId]?.forEach((sid) =>
              io.to(sid).emit("chat:cleared", { chatId })
            );
            onlineUsers[userId]?.forEach((sid) =>
              io.to(sid).emit("chat:cleared", { chatId })
            );
          }
        } catch (err) {
          console.error("clear_chat error:", err);
        }
      }
    );

    // ── Group message ──
    socket.on(
      "group_message",
      async ({
        groupId,
        text,
        fileUrl,
        fileType,
        fileName,
        fileSize,
      }: {
        groupId: string;
        text?: string;
        fileUrl?: string;
        fileType?: string;
        fileName?: string;
        fileSize?: number;
      }) => {
        const fromUserId = socketToUser[socket.id];
        if (!fromUserId || !groupId || (!text?.trim() && !fileUrl)) return;
        try {
          const conversation = await Conversation.findOne({
            _id: groupId,
            type: "group",
            participants: fromUserId,
          });
          if (!conversation) {
            socket.emit("error", {
              message: "Group not found or access denied",
            });
            return;
          }
          const msg = await Message.create({
            chatId: groupId,
            sender: fromUserId,
            text: text?.trim() || "",
            fileUrl: fileUrl || null,
            fileType: fileType || null,
            fileName: fileName || null, 
            fileSize: fileSize || null,
            status: [],
          });
          const populated = await msg.populate("sender", "username _id");
          await Conversation.findByIdAndUpdate(groupId, {
            lastMessage: msg._id,
          });
          conversation.participants.forEach((participantId: any) => {
            const pid = participantId.toString();
            if (onlineUsers[pid])
              onlineUsers[pid].forEach((socketId) => {
                io.to(socketId).emit("receive_group_message", {
                  ...populated.toObject(),
                  groupId,
                });
              });
          });
        } catch (err) {
          console.error("group_message error:", err);
          socket.emit("error", { message: "Failed to send group message" });
        }
      }
    );

    // ── Invitations ──
    socket.on("send_invitation", async ({ toUserId }) => {
      const senderId = socket.data.userId;
      if (!senderId || !toUserId) return;
      const receiverId = typeof toUserId === "object" ? toUserId.id : toUserId;
      try {
        const existingRecent = await Invitation.findOne({
          sender: senderId,
          receiver: receiverId,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
        if (existingRecent) {
          socket.emit("invitation:error", {
            message: "You can send only one invite in 24 hours",
          });
          return;
        }
        const pending = await Invitation.findOne({
          sender: senderId,
          receiver: receiverId,
          status: "pending",
        });
        if (pending) {
          socket.emit("invitation:error", {
            message: "Invite already pending",
          });
          return;
        }
        const invitation = await Invitation.create({
          sender: senderId,
          receiver: receiverId,
        });
        if (onlineUsers[receiverId]) {
          onlineUsers[receiverId].forEach((id) =>
            io.to(id).emit("invitation:received", invitation)
          );
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

      // Populate participants so clients get the username/lastSeen immediately
      const populatedConv = await Conversation.findById(
        conversation._id
      ).populate("participants", "username _id lastSeen");

      const senderSockets = onlineUsers[invitation.sender.toString()];
      const receiverSockets = onlineUsers[invitation.receiver.toString()];

      senderSockets?.forEach((id) =>
        io.to(id).emit("invitation:accepted", { conversation: populatedConv })
      );
      receiverSockets?.forEach((id) =>
        io.to(id).emit("invitation:accepted", { conversation: populatedConv })
      );
    });

    socket.on("reject_invitation", async (invitationId: any) => {
      const invitation: any = await Invitation.findById(invitationId);
      if (!invitation) return;
      invitation.status = "rejected";
      invitation.rejectedAt = new Date();
      await invitation.save();
      io.to(invitation.sender.toString()).emit("invitation:rejected", {
        invitationId,
      });
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
          onlineUsers[userId] = onlineUsers[userId].filter(
            (id) => id !== socket.id
          );
          if (onlineUsers[userId].length === 0) {
            delete onlineUsers[userId];
            delete userNames[userId];
            // Fallback: in case "logout" event wasn't emitted (tab close, network drop)
            try {
              const now = new Date();
              await User.findByIdAndUpdate(userId, { lastSeen: now });
              io.emit("user_last_seen", {
                userId,
                lastSeen: now.toISOString(),
              });
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
