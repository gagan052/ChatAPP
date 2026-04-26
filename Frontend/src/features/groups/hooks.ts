import { useEffect, useRef, useState } from "react";
import { onGroupMessage, offGroupMessage } from "../chat/socket";
import { api } from "../../services/http";

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

      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
    };

    onGroupMessage(handler);
    
    return () => offGroupMessage(handler);
  }, [myUserId]);

  return { messages, setMessages };
};