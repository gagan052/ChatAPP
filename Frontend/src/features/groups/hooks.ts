import { useEffect, useRef, useState } from "react";
import { onGroupMessage, offGroupMessage, onMessageUpdated, offMessageUpdated, onMessageDeleted, offMessageDeleted, onChatCleared, offChatCleared, onMessagesSeen, offMessagesSeen } from "../chat/socket";
import { api } from "../../services/http";
import { socket } from "../../services/socket";

export const fetchGroups = async () => {
  const data = await api("/api/groups");
  return data.groups;
};

export const createGroupApi = async (name: string, memberIds: string[]) => {
  return api("/api/groups/create", {
    method: "POST",
    body: JSON.stringify({ name, memberIds }),
  });
};

const fetchGroupMessages = async (groupId: string) => {
  return api(`/api/groups/${groupId}/messages`);
};

export const useGroups = (userId: string) => {
  const [groups, setGroups] = useState<any[]>([]);

  const loadGroups = () => {
    if (!userId) return;
    fetchGroups().then(setGroups).catch(console.error);
  };

  useEffect(() => {
    loadGroups();
  }, [userId]);

  return { groups, setGroups, reloadGroups: loadGroups };
};

export const useGroupChat = (myUserId: string, selectedGroupId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const selectedGroupRef = useRef(selectedGroupId);

  useEffect(() => {
    selectedGroupRef.current = selectedGroupId;
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) return;
    setMessages([]);
    fetchGroupMessages(selectedGroupId).then(setMessages).catch(console.error);
  }, [selectedGroupId]);

  useEffect(() => {
    const handler = (msg: any) => {
      if (!msg._id || !msg.text) return;
      if (msg.groupId !== selectedGroupRef.current) return;

      const msgSenderId = String(msg.sender?._id ?? msg.sender);
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

    onGroupMessage(handler);

    const updateHandler = (updatedMsg: any) => {
      if (updatedMsg.chatId !== selectedGroupRef.current) return;
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(updatedMsg._id) ? updatedMsg : m))
      );
    };

    const deleteHandler = ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      if (chatId !== selectedGroupRef.current) return;
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    };

    const clearHandler = ({ chatId }: { chatId: string }) => {
      if (chatId !== selectedGroupRef.current) return;
      setMessages([]);
    };

    const messagesSeenHandler = ({ messageIds, chatId, userId: seenByUserId, seenAt }: any) => {
      if (chatId !== selectedGroupRef.current) return;
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
      offGroupMessage(handler);
      offMessageUpdated(updateHandler);
      offMessageDeleted(deleteHandler);
      offChatCleared(clearHandler);
      offMessagesSeen(messagesSeenHandler);
    };
  }, [myUserId]);

  return { messages, setMessages };
};