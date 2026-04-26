import { socket } from "../../services/socket";

export const sendMessage = (toUserId: string, text: string) => {
  socket.emit("private_message", { toUserId, text });
};

export const sendGroupMessage = (groupId: string, text: string) => {
  socket.emit("group_message", { groupId, text });
};

export const onMessage = (cb: (msg: any) => void) => {
  socket.on("receive_private_message", cb);
};

export const offMessage = (cb: (msg: any) => void) => {
  socket.off("receive_private_message", cb);
};

export const onGroupMessage = (cb: (msg: any) => void) => {
  socket.on("receive_group_message", cb);
};

export const offGroupMessage = (cb: (msg: any) => void) => {
  socket.off("receive_group_message", cb);
};

export const onOnlineUsers = (cb: (users: string[]) => void) => {
  socket.on("online_users", cb);
};

export const offOnlineUsers = (cb: (users: string[]) => void) => {
  socket.off("online_users", cb);
};

export const editMessage = (messageId: string, text: string, toUserId?: string, isGroup?: boolean) => {
  socket.emit("edit_message", { messageId, text, toUserId, isGroup });
};

export const deleteMessageSocket = (messageId: string, toUserId?: string, isGroup?: boolean) => {
  socket.emit("delete_message", { messageId, toUserId, isGroup });
};

export const onMessageUpdated = (cb: (msg: any) => void) => {
  socket.on("message:updated", cb);
};

export const offMessageUpdated = (cb: (msg: any) => void) => {
  socket.off("message:updated", cb);
};

export const onMessageDeleted = (cb: (data: { messageId: string; chatId: string }) => void) => {
  socket.on("message:deleted", cb);
};

export const offMessageDeleted = (cb: (data: { messageId: string; chatId: string }) => void) => {
  socket.off("message:deleted", cb);
};

export const clearChatSocket = (chatId: string, toUserId?: string, isGroup?: boolean) => {
  socket.emit("clear_chat", { chatId, toUserId, isGroup });
};

export const onChatCleared = (cb: (data: { chatId: string }) => void) => {
  socket.on("chat:cleared", cb);
};

export const offChatCleared = (cb: (data: { chatId: string }) => void) => {
  socket.off("chat:cleared", cb);
};