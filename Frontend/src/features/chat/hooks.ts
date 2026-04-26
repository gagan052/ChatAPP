import { useEffect, useRef, useState } from "react";
import { onMessage, offMessage } from "./socket";
import { BASE_URL } from "../../services/http";

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

      // Must have _id and text to be a valid saved message
      if (!msg._id || !msg.text) return;

      const msgSenderId: string = String(msg.sender?._id ?? msg.sender);
      const otherParticipantId =
        msgSenderId === myUserId ? currentSelectedUserId : msgSenderId;

        
      const isRelevant =
        otherParticipantId === currentSelectedUserId &&
        (msgSenderId === myUserId || msgSenderId === currentSelectedUserId);

      if (!isRelevant) return;

      setMessages((prev) => {
        // Strict dedup by _id
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
    };

    onMessage(handler);
    return () => {
      offMessage(handler);
    };
  }, [myUserId]);

  return { messages, setMessages };
};