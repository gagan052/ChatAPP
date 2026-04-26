import { socket } from "../../services/socket";

export const sendInvitation = (toUserId: string) => {

  socket.emit("send_invitation", { toUserId });
};

export const onInvitationReceived = (cb: (inv: any) => void) => {
  socket.on("invitation:received", cb);
};

export const offInvitationReceived = (cb: (inv: any) => void) => {
  socket.off("invitation:received", cb);
};

export const onInvitationAccepted = (cb: (data: any) => void) => {
  socket.on("invitation:accepted", cb);
};

export const offInvitationAccepted = (cb: (data: any) => void) => {
  socket.off("invitation:accepted", cb);
};

export const onInvitationRejected = (cb: (data: any) => void) => {
  socket.on("invitation:rejected", cb);
};

export const offInvitationRejected = (cb: (data: any) => void) => {
  socket.off("invitation:rejected", cb);
};