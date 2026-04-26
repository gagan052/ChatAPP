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