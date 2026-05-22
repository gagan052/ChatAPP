import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../../services/socket";
import { useChat } from "../../features/chat/hooks";
// import Cookies from "js-cookie";
import {
  deleteGroupApi,
  useGroupChat,
  useGroups,
} from "../../features/groups/hooks";
import { sendMessage, sendGroupMessage } from "../../features/chat/socket";
import { uploadChatFile } from "../../features/chat/api";
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
  onInvitationError,
  offInvitationError,
} from "../../features/invitation/socket";
import { getPinnedChats, togglePinChat } from "../../features/utils/pinChats";
import SearchBar from "../../components/SearchBar/SearchBar";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

type ChatType = "private" | "group";

export default function ChatPage() {
  const navigate = useNavigate();
  // const token = Cookies.get("token");

  // if (!token) {
  //   return null;
  // }

  // Selected conversation
  const [currentUser, setCurrentUser] = useState<any>(null);
  const userId = currentUser?.id;
  const [username, setUsername] = useState("");
  const [chatType, setChatType] = useState<ChatType>("private");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "invitations">("chats");
  const [inviteCount, setInviteCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<{
    name: string;
    progress: number;
  } | null>(null);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  const isResizing = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const menuRef = useRef<HTMLDivElement | null>(null);

  const { logout } = useAuth();

  const { onlineUsers } = useUsers(username);
  const { messages: privateMessages } = useChat(userId, selectedUserId);
  const { groups, setGroups, reloadGroups } = useGroups(userId);
  const { messages: groupMessages } = useGroupChat(
    userId,
    selectedGroup?._id ?? null
  );

  const selectedUserObj = chatUsers.find((u) => u.id === selectedUserId);

  const sortedChats = [...chatUsers].sort((a, b) => {
    const aIndex = pinnedChats.indexOf(a.chatId);
    const bIndex = pinnedChats.indexOf(b.chatId);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return 0;
  });

  const messages = chatType === "private" ? privateMessages : groupMessages;

  const loadChats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api("/api/conversations");

      const mapped = data
        .map((conv: any) => {
          const other = conv.participants.find((p: any) => p._id !== userId);

          if (!other) return null;

          return {
            id: other._id,
            username: other.username,
            lastSeen: other.lastSeen,
            profilePic: other.profilePic,
            lastMessage: conv.lastMessage?.text || "",
            lastMessageFileUrl: conv.lastMessage?.fileUrl,
            lastMessageFileType: conv.lastMessage?.fileType,
            chatId: conv._id,
          };
        })
        .filter(Boolean);

      const unique = Array.from(
        new Map(mapped.map((u: any) => [u.id, u])).values()
      );

      setChatUsers(unique);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api("/api/auth/me");

        setCurrentUser(res.user);

        setUsername(res.user.username);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMe();
  }, []);

  useEffect(() => {
    const fetchInviteCount = async () => {
      try {
        const data = await api("/api/invitations/pending");
        if (data.invitations) {
          setInviteCount(data.invitations.length);
        }
      } catch (err) {
        console.error("Failed to fetch invite count", err);
      }
    };

    if (userId) {
      fetchInviteCount();
    }
  }, [userId]);

  useEffect(() => {
    setPinnedChats(getPinnedChats());
  }, []);

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
    const handleClick = () => {
      setActiveMenu(null);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    const handler = ({ conversation }: any) => {
      const otherUser = conversation.participants.find(
        (p: any) => p._id !== userId
      );

      if (otherUser) {
        setChatUsers((prev) => {
          const exists = prev.find((u) => u.id === otherUser._id);
          if (exists) return prev;
          return [
            {
              id: otherUser._id,
              username: otherUser.username,
              lastSeen: otherUser.lastSeen,
              profilePic: otherUser.profilePic,
            },
            ...prev,
          ];
        });

        setSelectedUserId(otherUser._id);
      }

      setActiveTab("chats");
      setInviteCount(0);

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

      if (msgSenderId !== userId && msgSenderId !== selectedUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msgSenderId]: (prev[msgSenderId] || 0) + 1,
        }));
      }

      const lastMessageText = msg.text || (msg.fileUrl ? "📎 File" : "");

      setChatUsers((prev) =>
        prev.map((u) => {
          if (
            u.id === msgSenderId ||
            (msgSenderId === userId && u.id === selectedUserId)
          ) {
            return {
              ...u,
              lastMessage: lastMessageText,
              lastMessageFileUrl: msg.fileUrl,
              lastMessageFileType: msg.fileType,
            };
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
    const handler = () => {
      reloadGroups();
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

  useEffect(() => {
    const handler = ({ message }: { message: string }) => {
      toast.error(message || "Failed to send invitation");
    };

    onInvitationError(handler);

    return () => {
      offInvitationError(handler);
    };
  }, []);

  useEffect(() => {
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

  // 1. message:updated — optimistically update sidebar text
  useEffect(() => {
    const handler = (updatedMessage: any) => {
      const chatId = String(
        updatedMessage.chatId?._id ?? updatedMessage.chatId
      );
      setChatUsers((prev) =>
        prev.map((u) =>
          u.chatId === chatId ? { ...u, lastMessage: updatedMessage.text } : u
        )
      );
    };

    socket.on("message:updated", handler);
    return () => {
      socket.off("message:updated", handler);
    };
  }, []);

  // 2. message:deleted — use newLastMessage from payload for instant update
  useEffect(() => {
    const handler = ({
      chatId,
      newLastMessage,
      newLastMessageFileUrl,
      newLastMessageFileType,
    }: {
      messageId: string;
      chatId: string;
      newLastMessage: string;
      newLastMessageFileUrl?: string | null;
      newLastMessageFileType?: string | null;
    }) => {
      setChatUsers((prev) =>
        prev.map((u) =>
          u.chatId === String(chatId)
            ? {
                ...u,
                lastMessage: newLastMessage,
                lastMessageFileUrl: newLastMessageFileUrl,
                lastMessageFileType: newLastMessageFileType,
              }
            : u
        )
      );
    };

    socket.on("message:deleted", handler);
    return () => {
      socket.off("message:deleted", handler);
    };
  }, []);

  // 3. chat:cleared — blank out lastMessage immediately
  useEffect(() => {
    const handler = ({ chatId }: { chatId: string }) => {
      setChatUsers((prev) =>
        prev.map((u) =>
          u.chatId === String(chatId)
            ? {
                ...u,
                lastMessage: "",
                lastMessageFileUrl: null,
                lastMessageFileType: null,
              }
            : u
        )
      );
    };

    socket.on("chat:cleared", handler);
    return () => {
      socket.off("chat:cleared", handler);
    };
  }, []);

  useEffect(() => {
    const handler = ({ chatId }: { chatId: string }) => {
      //  remove deleted chat from sidebar
      setChatUsers((prev) => prev.filter((c) => c.chatId !== chatId));

      //  if user is currently inside that chat → exit it
      if (selectedUserObj?.chatId === chatId) {
        setSelectedUser(null);
        setSelectedUserId(null);
      }
    };

    socket.on("chat:deleted", handler);

    return () => {
      socket.off("chat:deleted", handler);
    };
  }, [selectedUserObj]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  const handleGroupDeletedFromModal = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => String(g._id) !== String(groupId)));
    setSelectedGroup((sg: any) =>
      sg && String(sg._id) === String(groupId) ? null : sg
    );
  }, []);

  useEffect(() => {
    const onGroupUpdatedSocket = ({ group }: { group: any }) => {
      if (!group?._id) return;
      setGroups((prev) =>
        prev.map((g) => (String(g._id) === String(group._id) ? group : g))
      );
      setSelectedGroup((sg: any) =>
        sg && String(sg._id) === String(group._id) ? group : sg
      );
    };

    const onGroupDeletedSocket = ({ groupId }: { groupId: string }) => {
      handleGroupDeletedFromModal(groupId);
    };

    const onRemovedFromSocket = ({ groupId }: { groupId: string }) => {
      handleGroupDeletedFromModal(groupId);
    };

    socket.on("group:updated", onGroupUpdatedSocket);
    socket.on("group:deleted", onGroupDeletedSocket);
    socket.on("group:removed_from", onRemovedFromSocket);

    return () => {
      socket.off("group:updated", onGroupUpdatedSocket);
      socket.off("group:deleted", onGroupDeletedSocket);
      socket.off("group:removed_from", onRemovedFromSocket);
    };
  }, [handleGroupDeletedFromModal]);

  useEffect(() => {
    if (chatType === "group" && !selectedGroup) {
      setChatType("private");
    }
  }, [chatType, selectedGroup]);

  const startResizing = () => {
    isResizing.current = true;
  };

  const stopResizing = () => {
    isResizing.current = false;
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing.current) return;

    const newWidth = e.clientX;

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



  const handleSend = async () => {
    if (!text.trim() && !selectedFile) return;

    try {
      let fileData = null;

      if (selectedFile) {
        setUploadingFile({
          name: selectedFile.name,
          progress: 0,
        });

        fileData = await uploadChatFile(selectedFile, (progress) => {
          setUploadingFile((prev) => (prev ? { ...prev, progress } : prev));
        });

        setUploadingFile(null);
      }

      //  PRIVATE CHAT
      if (chatType === "private" && selectedUserId) {
        if (fileData) {
          sendMessage(selectedUserId, text.trim(), {
            fileUrl: fileData.fileUrl,
            fileType: fileData.fileType,
            fileName: selectedFile?.name,
            fileSize: selectedFile?.size,
          });
        } else {
          sendMessage(selectedUserId, text.trim());
        }
      }

      //  GROUP CHAT
      else if (chatType === "group" && selectedGroup) {
        if (fileData) {
          sendGroupMessage(selectedGroup._id, text.trim(), {
            fileUrl: fileData.fileUrl,
            fileType: fileData.fileType,
            fileName: selectedFile?.name,
            fileSize: selectedFile?.size,
          });
        } else {
          sendGroupMessage(selectedGroup._id, text.trim());
        }
      }

      setText("");
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
      setUploadingFile(null);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
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

  const goHome = useCallback(() => {
    setActiveTab("chats");
    setSearch("");
    setSearchResults([]);
    loadChats();
  }, [loadChats]);

  const handleInvite = (userId: string) => {
    const user = searchResults.find((u) => u.id === userId);

    if (!user) return;

    if (user.inviteStatus === "cooldown") {
      toast.error("You can send invite after 24 hours");
      return;
    }

    //  already pending
    if (user.inviteStatus === "pending") return;

    setSearchResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, inviteStatus: "pending" } : u))
    );

    // send socket    
    sendInvitation(userId);

    goHome();
  };

  const toggleMenu = (id: string) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  const handlePinChat = (chatId: string) => {
    const updated = togglePinChat(chatId);
    setPinnedChats(updated);
    setActiveMenu(null);
  };

  const handleDeleteChat = async (chatId: string) => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <p>Delete this chat?</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button onClick={closeToast}>Cancel</button>
            <button
              onClick={async () => {
                closeToast();
                try {
                  await api(`/api/conversations/${chatId}`, {
                    method: "DELETE",
                  });

                  setChatUsers((prev) =>
                    prev.filter((c) => c.chatId !== chatId)
                  );

                  if (selectedUserObj?.chatId === chatId) {
                    setSelectedUser(null);
                    setSelectedUserId(null);
                  }

                  toast.success("Chat deleted");
                } catch (err) {
                  toast.error("Failed to delete chat");
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleDeleteGroupLocal = (groupId: string) => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <p>Delete this group?</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button onClick={closeToast}>Cancel</button>
            <button
              onClick={async () => {
                closeToast();
                try {
                  await deleteGroupApi(groupId);

                  setGroups((prev) => prev.filter((g) => g._id !== groupId));

                  toast.success("Group deleted");
                } catch (err) {
                  toast.error("Failed to delete group");
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { autoClose: false }
    );
  };

  return (
    <div className="chat-container">
      {/* ── Sidebar ── */}
      <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
        <div className="sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: currentUser?.profilePic
                  ? `url(${currentUser.profilePic}) center/cover`
                  : "var(--color-accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "2px solid var(--color-surface-2)",
                overflow: "hidden",
              }}
              onClick={() => navigate("/settings")}
              title="Profile Settings"
            >
              {!currentUser?.profilePic && (
                <span
                  style={{
                    color: "var(--color-accent-text)",
                    fontSize: "14px",
                  }}
                >
                  {getInitials(username)}
                </span>
              )}
            </div>
            <h3 style={{ margin: 0 }}>Hi, {username}</h3>
          </div>

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
              <i
                className="fa-solid fa-people-group"
                style={{ color: "rgb(255, 255, 255)" }}
              ></i>
            </button>

            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>



        <SearchBar value={search} onChange={handleSearch} placeholder="Search users..." />




        {/* <div className="sidebar-search">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div> */}

        {searchResults.length > 0 && (
          <div className="list-of-user">
            <p className="list-section-label">Search Results</p>

            {searchResults.map((u) => (
              <div key={u.id} className="user search-user">
                <div
                  className="user-avatar search-user-avatar"
                  style={{
                    background: u.profilePic
                      ? `url(${u.profilePic}) center/cover`
                      : "var(--color-accent-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {!u.profilePic && u.username[0].toUpperCase()}
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
            <InvitationList
              onBack={() => setActiveTab("chats")}
              onAccept={goHome}
            />
          ) : (
            <>
              {sortedChats.map((u: any) => {
                const isActive =
                  chatType === "private" && selectedUserId === u.id;

                const hasLastFile = u.lastMessageFileUrl;
                const isLastImage = u.lastMessageFileType?.startsWith("image");
                const isLastVideo = u.lastMessageFileType?.startsWith("video");

                return (
                  <div
                    key={u.id}
                    className={`user ${isActive ? "active" : ""}`}
                    onClick={() => selectPrivateChat(u.username, u.id)}
                  >
                    <div
                      className="user-avatar"
                      style={{
                        background: u.profilePic
                          ? `url(${u.profilePic}) center/cover`
                          : "var(--color-accent-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {!u.profilePic && getInitials(u.username)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        className="user-name-container"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div className="user-name">{u.username}</div>

                        {
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              position: "relative",
                            }}
                          >
                            {unreadCounts[u.id] > 0 && (
                              <div
                                className="unread-badge"
                                style={{
                                  backgroundColor: "var(--color-accent)",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: "20px",
                                  height: "20px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                }}
                              >
                                {unreadCounts[u.id]}
                              </div>
                            )}

                            {
                              <div
                                // ref={menuRef}
                                className="chat-menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(u.id);
                                }}
                                style={{ border: "none", cursor: "pointer" }}
                              >
                                {pinnedChats.includes(u.chatId) && (
                                  <i
                                    className="fa-solid fa-thumbtack"
                                    style={{ marginLeft: 6, fontSize: "12px" }}
                                  ></i>
                                )}

                                <i className="fa-solid fa-ellipsis-vertical"></i>

                                {activeMenu === u.id && (
                                  <div
                                    className="menu-dropdown"
                                    style={{
                                      position: "absolute",
                                      right: 0,
                                      top: "100%",
                                      backgroundColor: "var(--color-surface)",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                      borderRadius: "4px",
                                      zIndex: 100,
                                      padding: "8px 8px",
                                    }}
                                  >
                                    <div
                                      onClick={() => handlePinChat(u.chatId)}
                                    >
                                      {pinnedChats.includes(u.chatId)
                                        ? "Unpin"
                                        : "Pin"}
                                    </div>
                                    <div
                                      onClick={() => handleDeleteChat(u.chatId)}
                                    >
                                      Delete
                                    </div>
                                  </div>
                                )}
                              </div>
                            }
                          </div>
                        }
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {hasLastFile &&
                          (isLastImage ? (
                            <i
                              className="fa-solid fa-image"
                              style={{ color: "var(--color-text-faint)" }}
                            ></i>
                          ) : isLastVideo ? (
                            <i
                              className="fa-solid fa-video"
                              style={{ color: "var(--color-text-faint)" }}
                            ></i>
                          ) : (
                            <i
                              className="fa-solid fa-file"
                              style={{ color: "var(--color-text-faint)" }}
                            ></i>
                          ))}
                        <span className="last-message">
                          {u.lastMessage ||
                            (hasLastFile ? "📎 File" : "No messages yet")}
                        </span>
                      </div>
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

                    const hasLastFile = g.lastMessage?.fileUrl;
                    const isLastImage =
                      g.lastMessage?.fileType?.startsWith("image");
                    const isLastVideo =
                      g.lastMessage?.fileType?.startsWith("video");

                    return (
                      <div
                        key={g._id}
                        className={`user ${isActive ? "active" : ""}`}
                        onClick={() => selectGroupChat(g)}
                      >
                        <div
                          className="user-avatar group-avatar"
                          style={{
                            background: g.groupInfo?.avatar
                              ? `url(${g.groupInfo.avatar}) center/cover`
                              : undefined,
                          }}
                        >
                          {!g.groupInfo?.avatar &&
                            getInitials(g.groupInfo?.name || "G")}
                        </div>

                        <div className="user-meta">
                          <div className="user-name">{g.groupInfo?.name}</div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {hasLastFile &&
                              (isLastImage ? (
                                <i
                                  className="fa-solid fa-image"
                                  style={{ color: "var(--color-text-faint)" }}
                                ></i>
                              ) : isLastVideo ? (
                                <i
                                  className="fa-solid fa-video"
                                  style={{ color: "var(--color-text-faint)" }}
                                ></i>
                              ) : (
                                <i
                                  className="fa-solid fa-file"
                                  style={{ color: "var(--color-text-faint)" }}
                                ></i>
                              ))}
                            <span
                              className="user-preview"
                              style={{
                                fontSize: "12px",
                                color: "var(--color-text-faint)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "150px",
                              }}
                            >
                              {g.lastMessage?.text ||
                                (hasLastFile
                                  ? "📎 File"
                                  : `${g.participants?.length || 0} members`)}
                            </span>
                          </div>
                        </div>
                        {
                          <div
                            className="group-menu"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(g._id);
                            }}
                            style={{
                              border: "none",
                              cursor: "pointer",
                              position: "relative",
                            }}
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>

                            {activeMenu === g._id && (
                              <div
                                className="menu-dropdown"
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "100%",
                                  backgroundColor: "var(--color-surface)",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  borderRadius: "4px",
                                  zIndex: 100,
                                  padding: "8px 8px",
                                }}
                              >
                                <div onClick={() => handlePinChat(g._id)}>
                                  {pinnedChats.includes(g._id)
                                    ? "Unpin"
                                    : "Pin"}
                                </div>

                                <div
                                  onClick={() => handleDeleteGroupLocal(g._id)}
                                >
                                  Delete
                                </div>
                              </div>
                            )}
                          </div>
                        }
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
        uploadingFile={uploadingFile}
        chatId={
          chatType === "private" ? selectedUserObj?.chatId : selectedGroup?._id
        }
        messages={messages}
        text={text}
        onTextChange={setText}
        onSend={handleSend}
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        onClearSelectedFile={() => setSelectedFile(null)}
        userId={userId}
        onlineUsers={onlineUsers}
        selectedUserObj={selectedUserObj}
        onGroupUpdated={(updatedGroup: any) => {
          setSelectedGroup(updatedGroup);
          setGroups((prev) =>
            prev.map((g) =>
              String(g._id) === String(updatedGroup._id) ? updatedGroup : g
            )
          );
        }}
        onGroupDeleted={handleGroupDeletedFromModal}
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
