import { useEffect, useState } from "react";
import { onOnlineUsers, offOnlineUsers } from "../chat/socket";
import { fetchUsers } from "./api";

export const useUsers = (currentUsername: string) => {
    
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]); // starts empty — no stale state

  useEffect(() => {
    fetchUsers()
      .then((data) => {
        setUsers(data.filter((u: { username: string }) => u.username !== currentUsername));
      })
      .catch(console.error);

    // Always replace the full list — never merge — so removed users disappear instantly
    const handler = (onlineList: string[]) => {
      setOnlineUsers(onlineList.filter((u) => u !== currentUsername));
    };

    onOnlineUsers(handler);
    return () => offOnlineUsers(handler);
  }, [currentUsername]);

  return { users, onlineUsers };
};