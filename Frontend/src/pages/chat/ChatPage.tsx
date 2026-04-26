import { useEffect, useRef, useState, useCallback } from "react";
import { connectSocket } from "../../services/socket";
import { useChat } from "../../features/chat/hooks";
import { useGroupChat, useGroups } from "../../features/groups/hooks";
import { sendMessage, sendGroupMessage } from "../../features/chat/socket";
import { useUsers } from "../../features/users/hooks";
import { useAuth } from "../../features/auth/hooks";
import CreateGroupModal from "../../components/createGroupModal";
import InvitationList from "../../components/InvitationList/InvitationList";
import { api } from "../../services/http";
import "./chat.css";
import { toast } from "react-toastify";
import { socket } from "../../services/socket";
import ChatArea from "../../components/ChatArea/Chatarea";
import {
  onInvitationAccepted,
  offInvitationAccepted,
  sendInvitation,
} from "../../features/invitation/socket";
import {
  onInvitationReceived,
  offInvitationReceived,
} from "../../features/invitation/socket";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

type ChatType = "private" | "group";

export default function ChatPage() {
  const username = localStorage.getItem("username") || "";
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser?.id;

  // Selected conversation
  const [chatType, setChatType] = useState<ChatType>("private");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "invitations">("chats");
  const [inviteCount, setInviteCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [sidebarWidth, setSidebarWidth] = useState(280);

  const isResizing = useRef(false);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { logout } = useAuth();
  const { users, onlineUsers } = useUsers(username);
  const { messages: privateMessages } = useChat(userId, selectedUserId);
  const { groups, reloadGroups } = useGroups(userId);
  const { messages: groupMessages } = useGroupChat(
    userId,
    selectedGroup?._id ?? null
  );

  const messages = chatType === "private" ? privateMessages : groupMessages;

  const loadChats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api("/api/conversations");

      const mapped = data.map((conv: any) => {
        const other = conv.participants.find((p: any) => p._id !== userId);

        if (!other) return null;

        return {
          id: other._id,
          username: other.username,
          lastSeen: other.lastSeen,
          lastMessage: conv.lastMessage?.text || "",
          chatId: conv._id,
        };
      }).filter(Boolean);

      const unique = Array.from(
        new Map(mapped.map((u: any) => [u.id, u])).values()
      );

      setChatUsers(unique);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (userId && username) connectSocket(userId, username);
  }, [userId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = ({ conversation }: any) => {
      const otherUser = conversation.participants.find(
        (p: any) => p._id !== userId
      );

      if (otherUser) {
        // Optimistically update chat list
        setChatUsers((prev) => {
          const exists = prev.find((u) => u.id === otherUser._id);
          if (exists) return prev;
          return [
            {
              id: otherUser._id,
              username: otherUser.username,
              lastSeen: otherUser.lastSeen,
            },
            ...prev,
          ];
        });

        // open chat automatically
        setSelectedUserId(otherUser._id);
      }

      // switch to chats tab
      setActiveTab("chats");
      // reset invite count
      setInviteCount(0);
      // reload chat list to ensure consistency
      loadChats();
    };

    onInvitationAccepted(handler);

    return () => {
      offInvitationAccepted(handler);
    };
  }, [userId, loadChats]);

  useEffect(() => {
    if (!selectedUserId) return;
    setUnreadCounts((prev) => ({ ...prev, [selectedUserId]: 0 }));
  }, [selectedUserId]);

  useEffect(() => {
    const handler = (msg: any) => {
      const msgSenderId = String(msg.sender?._id ?? msg.sender);
      
      // Update unread counts
      if (msgSenderId !== userId && msgSenderId !== selectedUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msgSenderId]: (prev[msgSenderId] || 0) + 1,
        }));
      }

      // Update last message in chatUsers list
      setChatUsers((prev) => 
        prev.map((u) => {
          if (u.id === msgSenderId || (msgSenderId === userId && u.id === selectedUserId)) {
            return { ...u, lastMessage: msg.text };
          }
          return u;
        })
      );
    };

    socket.on("receive_private_message", handler);
    return () => {
      socket.off("receive_private_message", handler);
    };
  }, [userId, selectedUserId]);

  useEffect(() => {
    const handler = (msg: any) => {
      // Update last message in groups list
      reloadGroups(); // Simplest way to ensure everything is in sync including member counts etc.
    };

    socket.on("receive_group_message", handler);
    return () => {
      socket.off("receive_group_message", handler);
    };
  }, [reloadGroups]);

  useEffect(() => {
    const handler = (inv: any) => {
      setInviteCount((prev) => prev + 1);
      toast.info(`New invitation from ${inv.sender?.username || "someone"}`);
    };

    onInvitationReceived(handler);

    return () => {
      offInvitationReceived(handler);
    };
  }, []);

  if (!username) {
    window.location.href = "/";
    return null;
  }

  useEffect(() => {
    // When any user goes offline, server broadcasts their fresh lastSeen
    const handler = ({
      userId,
      lastSeen,
    }: {
      userId: string;
      lastSeen: string;
    }) => {
      setChatUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, lastSeen } : u))
      );
    };

    socket.on("user_last_seen", handler);
    return () => {
      socket.off("user_last_seen", handler);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  const startResizing = () => {
    isResizing.current = true;
  };

  const stopResizing = () => {
    isResizing.current = false;
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing.current) return;

    const newWidth = e.clientX;

    // limit min/max
    if (newWidth < 200 || newWidth > 500) return;

    setSidebarWidth(newWidth);
  };

  const handleSearch = async (value: string) => {
    setSearch(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await api(`/api/users/search?q=${value}`);
      console.log("SEARCH RESULT:", data);

      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    if (chatType === "private" && selectedUserId) {
      sendMessage(selectedUserId, text.trim());
    } else if (chatType === "group" && selectedGroup) {
      sendGroupMessage(selectedGroup._id, text.trim());
    }
    setText("");
  };

  const selectPrivateChat = (uName: string, uId: string) => {
    setChatType("private");
    setSelectedUser(uName);
    setSelectedUserId(uId);
    setSelectedGroup(null);
  };

  const selectGroupChat = (group: any) => {
    setChatType("group");
    setSelectedGroup(group);
    setSelectedUser(null);
    setSelectedUserId(null);
  };

  const handleGroupCreated = (group: any) => {
    reloadGroups();
    selectGroupChat(group);
  };

  const selectedUserObj = chatUsers.find((u) => u.id === selectedUserId);

  const goHome = useCallback(() => {
    setActiveTab("chats");
    setSearch("");
    setSearchResults([]);
    loadChats();
  }, [loadChats]);

  const handleInvite = (userId: string) => {
    const user = searchResults.find((u) => u.id === userId);

    if (!user) return;

    //  cooldown case
    if (user.inviteStatus === "cooldown") {
      toast.error("You can send invite after 24 hours");
      return;
    }

    //  already pending
    if (user.inviteStatus === "pending") return;

    //  optimistic update
    setSearchResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, inviteStatus: "pending" } : u))
    );

    // send socket
    sendInvitation(userId);

    // Navigate to home after sending invite
    goHome();
  };

  // const headerName =
  //   chatType === "private" ? selectedUser : selectedGroup?.groupInfo?.name;

  // const headerInitials = headerName ? getInitials(headerName) : "";

  // const isOnline =
  //   chatType === "private" &&
  //   selectedUser &&
  //   onlineUsers.includes(selectedUser);

  // function homepage(){
  //     Navigate("/chat");
  // }

  return (
    <div className="chat-container">
      {/* ── Sidebar ── */}
      <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
        <div className="sidebar-header">
          <h3>Hi, {username}</h3>

          <div className="notification" style={{ display: "flex", gap: "6px" }}>
            <button
              className="notification-btn"
              onClick={() => setActiveTab("invitations")}
            >
              <span>
                <i className="fa-regular fa-bell"></i>
              </span>{" "}
              <span>{inviteCount > 0 && <span>({inviteCount})</span>}</span>
            </button>

            <button
              className="new-group-btn"
              onClick={() => setShowModal(true)}
              title="New group"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </button>

            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="list-of-user">
            <p className="list-section-label">Search Results</p>

            {searchResults.map((u) => (
              <div key={u.id} className="user search-user">
                <div className="user-avatar search-user-avatar">
                  {u.username[0].toUpperCase()}
                </div>

                <div className="user-name search-user-name">{u.username}</div>

                {u.inviteStatus === "pending" ? (
                  <button disabled>Pending</button>
                ) : (
                  <button
                    onClick={() => handleInvite(u.id)}
                    disabled={u.inviteStatus === "cooldown"}
                  >
                    {u.inviteStatus === "cooldown" ? "Wait" : "Invite"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <hr />

        <div className="user-list">
          {activeTab === "invitations" ? (
            <InvitationList onBack={() => setActiveTab("chats")} onAccept={goHome} />
          ) : (
            <>
              {chatUsers.map((u) => {
                const isActive =
                  chatType === "private" && selectedUserId === u.id;

                return (
                  <div
                    key={u.id}
                    className={`user ${isActive ? "active" : ""}`}
                    onClick={() => selectPrivateChat(u.username, u.id)}
                  >
                    <div className="user-avatar">{getInitials(u.username)}</div>
                    <div style={{ flex: 1 }}>
                      <div className="user-name-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="user-name">{u.username}</div>
                        {unreadCounts[u.id] > 0 && (
                          <div className="unread-badge" style={{ 
                            backgroundColor: "var(--color-accent)", 
                            color: "white", 
                            borderRadius: "50%", 
                            width: "20px", 
                            height: "20px", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "bold"
                          }}>
                            {unreadCounts[u.id]}
                          </div>
                        )}
                      </div>
                      <p className="last-message">{u.lastMessage || "No messages yet"}</p>
                    </div>
                  </div>
                );
              })}

              {/* GROUPS SECTION */}
              {groups.length > 0 && (
                <>
                  <p className="list-section-label">Groups</p>

                  {groups.map((g: any) => {
                    const isActive =
                      chatType === "group" && selectedGroup?._id === g._id;

                    return (
                      <div
                        key={g._id}
                        className={`user ${isActive ? "active" : ""}`}
                        onClick={() => selectGroupChat(g)}
                      >
                        <div className="user-avatar group-avatar">
                          {getInitials(g.groupInfo?.name || "G")}
                        </div>

                        <div className="user-meta">
                          <div className="user-name">{g.groupInfo?.name}</div>
                          <div className="user-preview" style={{ 
                            fontSize: "12px", 
                            color: "var(--color-text-faint)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "150px"
                          }}>
                            {g.lastMessage?.text || `${g.participants?.length || 0} members`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="divider" onMouseDown={startResizing} />

      <ChatArea
        chatType={chatType}
        selectedUser={selectedUser}
        selectedUserId={selectedUserId}
        selectedGroup={selectedGroup}
        chatId={chatType === "private" ? selectedUserObj?.chatId : selectedGroup?._id}
        messages={messages}
        text={text}
        onTextChange={setText}
        onSend={handleSend}
        userId={userId}
        onlineUsers={onlineUsers}
        selectedUserObj={selectedUserObj}
      />

      {showModal && (
        <CreateGroupModal
          users={chatUsers}
          onClose={() => setShowModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
