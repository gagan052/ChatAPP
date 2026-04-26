import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    if (userId && username) connectSocket(userId, username);
  }, [userId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = ({ conversation }: any) => {
      // open chat automatically
      setSelectedUserId(conversation.participants[0]);
    };

    onInvitationAccepted(handler);

    return () => offInvitationAccepted(handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      setInviteCount((prev) => prev + 1);
    };

    onInvitationReceived(handler);

    return () => offInvitationReceived(handler);
  }, []);

  if (!username) {
    window.location.href = "/";
    return null;
  }

  useEffect(() => {
    const handler = ({ conversation }: any) => {
      const otherUserId = conversation.participants.find(
        (id: string) => id !== userId
      );

      // switch to chats tab
      setActiveTab("chats");
      // open chat automatically
      setSelectedUserId(otherUserId);
      // reset invite count
      setInviteCount(0);
    };

    onInvitationAccepted(handler);

    return () => offInvitationAccepted(handler);
  }, [userId]);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const data = await api("/api/conversations");

        const mapped = data.map((conv: any) => {
          const other = conv.participants.find((p: any) => p._id !== userId);

          return {
            id: other._id,
            username: other.username,
            lastSeen: other.lastSeen,
          };
        });

        const unique = Array.from(
          new Map(mapped.map((u: any) => [u.id, u])).values()
        );

        setChatUsers(unique);

        console.log(unique);

        console.log(chatUsers);
      } catch (err) {
        console.error(err);
      }
    };

    if (userId) loadChats();
  }, [userId]);

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
    return () => socket.off("user_last_seen", handler);
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
            <InvitationList onBack={() => {}} />
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
                    <div>
                      <div className="user-name">{u.username}</div>
                      <p className="last-message">hello</p>
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
                          <div className="user-preview">
                            {g.participants?.length || 0} members
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
          users={users.filter((u: any) => typeof u !== "string")}
          onClose={() => setShowModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
