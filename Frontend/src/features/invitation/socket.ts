import { socket } from "../../services/socket";

export const sendInvitation = (toUserId: string) => {

  socket.emit("send_invitation", { toUserId });
  console.log("Invitation Send from socket.ts")
};

export const onInvitationReceived = (cb: (inv: any) => void) => {
  console.log("Invitation Received from socket.ts")
  socket.on("invitation:received", cb);
};

export const offInvitationReceived = (cb: (inv: any) => void) => {
  console.log("Off Inviatation received ")
  socket.off("invitation:received", cb);
};

export const onInvitationAccepted = (cb: (data: any) => void) => {
  console.log("on Invitation Accept")
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

export const onInvitationError = (cb: (data: any) => void) => {
  socket.on("invitation:error", cb);
};

export const offInvitationError = (cb: (data: any) => void) => {
  socket.off("invitation:error", cb);
};