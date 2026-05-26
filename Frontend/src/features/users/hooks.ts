import { useEffect, useState } from "react";
import { onOnlineUsers, offOnlineUsers } from "../chat/socket";
import { fetchUsers } from "./api";

export const useUsers = (currentUserId: string) => {
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);

  // stores ONLINE USER IDS
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers()
      .then((data) => {
        // remove current logged-in user
        setUsers(data.filter((u: { id: string }) => u.id !== currentUserId));
      })
      .catch(console.error);

    // receives online USER IDS from backend
    const handler = (onlineList: string[]) => {
      setOnlineUsers(onlineList.filter((id) => id !== currentUserId));
    };

    onOnlineUsers(handler);

    return () => {
      offOnlineUsers(handler);
    };
  }, [currentUserId]);

  return { users, onlineUsers };
};
