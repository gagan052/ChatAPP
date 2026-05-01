import { useEffect, useRef, useState } from "react";
import { onMessage, offMessage, onMessageUpdated, offMessageUpdated, onMessageDeleted, offMessageDeleted, onChatCleared, offChatCleared, onMessagesSeen, offMessagesSeen } from "./socket";
import { BASE_URL } from "../../services/http";
import { socket } from "../../services/socket";

// const BASE_URL = "http://localhost:3001";

const fetchMessages = async (myUserId: string, otherUserId: string) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/messages/${myUserId}/${otherUserId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
};

export const useChat = (myUserId: string, selectedUserId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const selectedUserIdRef = useRef(selectedUserId);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  // Load history when conversation changes
  useEffect(() => {
    if (!selectedUserId || !myUserId) return;
    setMessages([]);
    fetchMessages(myUserId, selectedUserId).then(setMessages).catch(console.error);

  }, [selectedUserId, myUserId]);

  // Real-time incoming messages
  useEffect(() => {
    const handler = (msg: any) => {
      const currentSelectedUserId = selectedUserIdRef.current;

      // Must have _id and either text or fileUrl
      if (!msg._id || (!msg.text && !msg.fileUrl)) return;

      const msgSenderId: string = String(msg.sender?._id ?? msg.sender);
      const otherParticipantId =
        msgSenderId === myUserId ? currentSelectedUserId : msgSenderId;

        
      const isRelevant =
        otherParticipantId === currentSelectedUserId &&
        (msgSenderId === myUserId || msgSenderId === currentSelectedUserId);

      if (!isRelevant) return;

      // Mark as seen immediately if we are the receiver
      if (msgSenderId !== myUserId) {
        socket.emit("mark_seen", {
          chatId: msg.chatId,
          userId: myUserId,
        });
      }

      setMessages((prev) => {
      
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
    };

    onMessage(handler);

    const updateHandler = (updatedMsg: any) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(updatedMsg._id) ? updatedMsg : m))
      );
    };

    const deleteHandler = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    };

    const clearHandler = () => {
      setMessages([]);
    };

    const messagesSeenHandler = ({ messageIds, userId: seenByUserId, seenAt }: any) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (messageIds.includes(msg._id)) {
            const updatedStatus = msg.status.map((s: any) => {
              if (String(s.userId) === String(seenByUserId)) {
                return { ...s, seen: seenAt };
              }
              return s;
            });
            return { ...msg, status: updatedStatus };
          }
          return msg;
        })
      );
    };

    onMessageUpdated(updateHandler);
    onMessageDeleted(deleteHandler);
    onChatCleared(clearHandler);
    onMessagesSeen(messagesSeenHandler);

    return () => {
      offMessage(handler);
      offMessageUpdated(updateHandler);
      offMessageDeleted(deleteHandler);
      offChatCleared(clearHandler);
      offMessagesSeen(messagesSeenHandler);
    };
  }, [myUserId]);

  return { messages, setMessages };
};