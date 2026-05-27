import { Server, Socket } from "socket.io";
import Message from "../models/message";
import Conversation from "../models/conversation";
import Invitation from "../models/invitation";
import User from "../models/user";
import { redis } from "../config/redis";
import chalk from "chalk";
// const socketToUser: Record<string, string> = {};

const emitToUser = async (
  io: Server,
  userId: string,
  event: string,
  payload: any
) => {
  const sockets = await redis.smembers(`chatapp:user:${userId}:sockets`);

  sockets.forEach((sid: string) => {
    io.to(sid).emit(event, payload);
  });
};

const getOnlineUsers = async () => {
  return await redis.smembers("chatapp:online_users");
};

/** Notify all socket tabs for each user id (works with existing onlineUsers map). */
export const notifyUserSockets = async (
  io: Server,
  userIds: string[],
  event: string,
  payload: unknown
) => {
  for (const uid of userIds) {
    // get all active sockets of user
    const sockets = await redis.smembers(`chatapp:user:${uid}:sockets`);

    // emit to every socket
    sockets.forEach((sid: string) => {
      io.to(sid).emit(event, payload);
    });
  }
};

export const handleSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(chalk.yellow("Socket connected:"), socket.id);

    // ── Join with user ID ──
    socket.on("join", async ({ userId }) => {
      socket.data.userId = userId;

      await redis.set(`chatapp:socket:${socket.id}:user`, userId);

      await redis.sadd(`chatapp:user:${userId}:sockets`, socket.id);

      await redis.sadd("chatapp:online_users", userId);

      const online = await getOnlineUsers();

      io.emit("online_users", online);

      console.log(`User joined: ${userId}`);
    });

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
        const fromUserId =
          socket.data.userId ||
          (await redis.get(`chatapp:socket:${socket.id}:user`));

        if (!fromUserId || !toUserId) return;

        console.log("PRIVATE MESSAGE USER:", socket.data.userId);

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

          console.log(chalk.yellow("SENDING MESSAGE:"), {
            fromUserId,
            toUserId,
          });

          const isOnline = await redis.sismember(
            "chatapp:online_users",
            toUserId
          );

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
                delivered: isOnline ? new Date() : null,
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
          // if (onlineUsers[toUserId])
          //   onlineUsers[toUserId].forEach((id) =>
          //     io.to(id).emit("receive_private_message", updatedMsg)
          //   );
          // if (onlineUsers[fromUserId])
          //   onlineUsers[fromUserId].forEach((id) =>
          //     io.to(id).emit("receive_private_message", updatedMsg)
          //   );
          await emitToUser(io, toUserId, "receive_private_message", updatedMsg);

          await emitToUser(
            io,
            fromUserId,
            "receive_private_message",
            updatedMsg
          );
        } catch (err) {
          console.error(chalk.red("private_message error:"), err);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // ── Mark messages seen ──
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
        console.error(chalk.red("mark_seen error:"), err);
      }
    });

    // ── Join chat room ──
    socket.on("join_chat", (chatId: string) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // ── Leave chat room ──
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
        const userId = socket.data.userId;

        if (!userId || !messageId || !text?.trim()) return;

        try {
          const message = await Message.findById(messageId);

          // only sender can edit
          if (!message || message.sender.toString() !== userId) return;

          // update message
          message.text = text.trim();
          message.isEdited = true;

          await message.save();

          // populate sender
          const populated = await message.populate("sender", "username _id");

          // ───── GROUP MESSAGE ─────
          if (isGroup && message.chatId) {
            const conversation = await Conversation.findById(message.chatId);

            if (!conversation) return;

            // emit to all group participants
            for (const participantId of conversation.participants) {
              const pid = participantId.toString();

              await emitToUser(io, pid, "message:updated", populated);
            }
          }

          // ───── PRIVATE MESSAGE ─────
          else if (toUserId) {
            // receiver
            await emitToUser(io, toUserId, "message:updated", populated);

            // sender (all tabs/devices)
            await emitToUser(io, userId, "message:updated", populated);
          }
        } catch (err) {
          console.error("edit_message error:", err);
        }
      }
    );

    // ── Delete message ──
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
        const userId = socket.data.userId;

        if (!userId || !messageId) return;

        try {
          const message = await Message.findById(messageId);

          // only sender can delete
          if (!message || message.sender.toString() !== userId) return;

          const chatId = message.chatId;

          // delete message
          await Message.findByIdAndDelete(messageId);

          // get latest remaining message
          const latestMsg = await Message.findOne({
            chatId,
          }).sort({
            createdAt: -1,
          });

          // update conversation lastMessage
          await Conversation.findByIdAndUpdate(chatId, {
            lastMessage: latestMsg?._id ?? null,
          });

          // payload for frontend
          const payload = {
            messageId,
            chatId,

            newLastMessage: latestMsg?.text ?? "",

            newLastMessageFileUrl: latestMsg?.fileUrl ?? null,

            newLastMessageFileType: latestMsg?.fileType ?? null,
          };

          // ───── GROUP CHAT ─────
          if (isGroup && chatId) {
            const conversation = await Conversation.findById(chatId);

            if (!conversation) return;

            for (const participantId of conversation.participants) {
              const pid = participantId.toString();

              await emitToUser(io, pid, "message:deleted", payload);
            }
          }

          // ───── PRIVATE CHAT ─────
          else if (toUserId) {
            // receiver
            await emitToUser(io, toUserId, "message:deleted", payload);

            // sender (all tabs/devices)
            await emitToUser(io, userId, "message:deleted", payload);
          }
        } catch (err) {
          console.error("delete_message error:", err);
        }
      }
    );

    // ── Clear chat ──
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
        const userId = socket.data.userId;

        if (!userId || !chatId) return;

        try {
          const conversation = await Conversation.findById(chatId);

          if (!conversation) return;

          // verify participant
          const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId
          );

          if (!isParticipant) return;

          // delete all messages
          await Message.deleteMany({ chatId });

          // clear last message
          await Conversation.findByIdAndUpdate(chatId, {
            lastMessage: null,
          });

          const payload = { chatId };

          // ───── GROUP CHAT ─────
          if (isGroup) {
            for (const participantId of conversation.participants) {
              const pid = participantId.toString();

              await emitToUser(io, pid, "chat:cleared", payload);
            }
          }

          // ───── PRIVATE CHAT ─────
          else if (toUserId) {
            // receiver
            await emitToUser(io, toUserId, "chat:cleared", payload);

            // sender (all tabs/devices)
            await emitToUser(io, userId, "chat:cleared", payload);
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
        const fromUserId = socket.data.userId;

        if (!fromUserId || !groupId || (!text?.trim() && !fileUrl)) return;

        try {
          // verify group membership
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

          // create message
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

          // populate sender
          const populated = await msg.populate(
            "sender",
            "username _id profilePic"
          );

          // update last message
          await Conversation.findByIdAndUpdate(groupId, {
            lastMessage: msg._id,
          });

          // payload
          const payload = {
            ...populated.toObject(),
            groupId,
          };

          // emit to ALL participants
          for (const participantId of conversation.participants) {
            const pid = participantId.toString();

            await emitToUser(io, pid, "receive_group_message", payload);
          }
        } catch (err) {
          console.error("group_message error:", err);

          socket.emit("error", {
            message: "Failed to send group message",
          });
        }
      }
    );

    // ── Invitations ──
    socket.on("send_invitation", async ({ toUserId }) => {
      const senderId = await redis.get(`chatapp:socket:${socket.id}:user`);

      if (!senderId || !toUserId) {
        console.log("hello");
        return;
      }

      console.log("Invitation socket backend", {
        senderId,
        toUserId,
      });

      const receiverId = typeof toUserId === "object" ? toUserId.id : toUserId;

      try {
        // ───── CHECK EXISTING CONTACT ─────
        const existingConversation = await Conversation.findOne({
          type: "private",

          participants: {
            $all: [senderId, receiverId],
          },
        });

        if (existingConversation) {
          socket.emit("invitation:error", {
            message: "Already contacts",
          });

          return;
        }

        // ───── CHECK RECENT REJECTION ─────
        const rejected = await Invitation.findOne({
          sender: senderId,

          receiver: receiverId,

          status: "rejected",

          rejectedAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        });

        if (rejected) {
          socket.emit("invitation:error", {
            message: "Wait 24h after rejection",
          });

          return;
        }

        // ───── CHECK PENDING INVITE ─────
        const pending = await Invitation.findOne({
          $or: [
            {
              sender: senderId,
              receiver: receiverId,
            },

            {
              sender: receiverId,
              receiver: senderId,
            },
          ],

          status: "pending",
        });

        if (pending) {
          socket.emit("invitation:error", {
            message: "Invite already pending",
          });

          return;
        }

        // ───── CREATE INVITATION ─────
        const invitation = await Invitation.create({
          sender: senderId,
          receiver: receiverId,
          status: "pending",
        });

        // populate sender info
        const populated = await invitation.populate(
          "sender",
          "username profilePic"
        );

        // ───── EMIT TO RECEIVER ─────
        await emitToUser(io, receiverId, "invitation:received", populated);

        // optional confirmation to sender
        await emitToUser(io, senderId, "invitation:sent", populated);
      } catch (err) {
        console.error("Invite error:", err);

        socket.emit("invitation:error", {
          message: "Failed to send invitation",
        });
      }
    });

    // ── Accept invitation ──
    socket.on("accept_invitation", async (invitationId) => {
      try {
        const invitation = await Invitation.findById(invitationId);

        if (!invitation) return;

        // update invitation status
        invitation.status = "accepted";

        await invitation.save();

        // create private conversation
        const conversation = await Conversation.create({
          type: "private",
          participants: [invitation.sender, invitation.receiver],
        });

        // populate participants
        const populatedConv = await Conversation.findById(conversation._id)
          .populate("participants", "username _id lastSeen profilePic")
          .populate("lastMessage", "text fileUrl fileType createdAt sender");

        // CLEAR REDIS CHAT LIST CACHE
        await Promise.all([
          redis.del(`chat:list:${invitation.sender}`),
          redis.del(`chat:list:${invitation.receiver}`),
        ]);

        // payload
        const payload = {
          conversation: populatedConv,
        };

        // emit to sender
        await emitToUser(
          io,
          invitation.sender.toString(),
          "invitation:accepted",
          payload
        );

        // emit to receiver
        await emitToUser(
          io,
          invitation.receiver.toString(),
          "invitation:accepted",
          payload
        );
      } catch (err) {
        console.error("accept_invitation error:", err);

        socket.emit("invitation:error", {
          message: "Failed to accept invitation",
        });
      }
    });

    // ── Reject invitation ──
    socket.on("reject_invitation", async (invitationId: string) => {
      try {
        const invitation: any = await Invitation.findById(invitationId);

        if (!invitation) return;

        // update invitation
        invitation.status = "rejected";

        invitation.rejectedAt = new Date();

        await invitation.save();

        // payload
        const payload = {
          invitationId,
        };

        // notify sender
        await emitToUser(
          io,
          invitation.sender.toString(),
          "invitation:rejected",
          payload
        );
      } catch (err) {
        console.error("reject_invitation error:", err);

        socket.emit("invitation:error", {
          message: "Failed to reject invitation",
        });
      }
    });

    // ── Logout ──
    socket.on("logout", async () => {
      try {
        const userId = socket.data.userId;

        if (!userId) return;

        // remove current socket
        await redis.srem(`chatapp:user:${userId}:sockets`, socket.id);

        // delete socket mapping
        await redis.del(`chatapp:socket:${socket.id}:user`);

        // remaining sockets
        const remainingSockets = await redis.scard(
          `chatapp:user:${userId}:sockets`
        );

        // fully offline
        if (remainingSockets === 0) {
          const now = new Date();

          await Promise.all([
            redis.srem("chatapp:online_users", userId),

            redis.del(`chatapp:user:${userId}:sockets`),

            User.findByIdAndUpdate(userId, {
              lastSeen: now,
            }),
          ]);

          io.emit("user_last_seen", {
            userId,
            lastSeen: now.toISOString(),
          });
        }

        // updated online users
        const online = await getOnlineUsers();

        io.emit("online_users", online);

        console.log(chalk.yellow("User logged out:"), userId);

        socket.disconnect(true);
      } catch (err) {
        console.error("logout error:", err);
      }
    });

    // ── Disconnect — fallback lastSeen write ──
    socket.on("disconnect", async () => {
      try {
        const userId = await redis.get(`chatapp:socket:${socket.id}:user`);

        if (!userId) return;

        // remove socket
        await redis.srem(`chatapp:user:${userId}:sockets`, socket.id);

        // remaining sockets
        const remainingSockets = await redis.smembers(
          `chatapp:user:${userId}:sockets`
        );

        // fully offline
        if (remainingSockets.length === 0) {
          const now = new Date();

          await Promise.all([
            // remove from online users
            redis.srem("chatapp:online_users", userId),

            // delete empty socket set
            redis.del(`chatapp:user:${userId}:sockets`),

            // update last seen
            User.findByIdAndUpdate(userId, {
              lastSeen: now,
            }),
          ]);

          io.emit("user_last_seen", {
            userId,
            lastSeen: now.toISOString(),
          });
        }

        // cleanup socket mapping
        await redis.del(`chatapp:socket:${socket.id}:user`);

        // updated online users
        const online = await getOnlineUsers();

        io.emit("online_users", online);

        console.log(chalk.yellow("Disconnected:"), socket.id);
      } catch (err) {
        console.error("disconnect error:", err);
      }
    });
  });
};
