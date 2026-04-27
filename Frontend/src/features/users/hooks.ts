import { useEffect, useState } from "react";
import { onOnlineUsers, offOnlineUsers } from "../chat/socket";
import { fetchUsers } from "./api";

export const useUsers = (currentUsername: string) => {
    
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]); 

  useEffect(() => {
    fetchUsers()
      .then((data) => {
        setUsers(data.filter((u: { username: string }) => u.username !== currentUsername));
      })
      .catch(console.error);

    const handler = (onlineList: string[]) => {
      setOnlineUsers(onlineList.filter((u) => u !== currentUsername));
    };

    onOnlineUsers(handler);
    return () => {
      offOnlineUsers(handler);
    };
  }, [currentUsername]);

  return { users, onlineUsers };
};

