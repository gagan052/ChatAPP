import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { socket, connectSocket } from "../services/socket";
import { api } from "../services/http";
import { useAuth } from "../features/auth/hooks";
import { useUsers } from "../features/users/hooks";
import { useChat } from "../features/chat/hooks";
import {
  useGroupChat,
  useGroups,
  deleteGroupApi,
} from "../features/groups/hooks";
import { sendMessage, sendGroupMessage } from "../features/chat/socket";
import { uploadChatFile } from "../features/chat/api";
import {
  onInvitationAccepted,
  offInvitationAccepted,
  onInvitationReceived,
  offInvitationReceived,
  onInvitationError,
  offInvitationError,
  sendInvitation,
} from "../features/invitation/socket";
import { getPinnedChats } from "../features/utils/pinChats";

type ChatType = "private" | "group";

interface ChatContextType {
  currentUser: any;
  username: string;
  chatType: ChatType;
  setChatType: (type: ChatType) => void;
  selectedUser: string | null;
  setSelectedUser: (id: string | null) => void;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  selectedGroup: any | null;
  setSelectedGroup: (group: any | null) => void;
  activeTab: "chats" | "invitations" | "groups";
  setActiveTab: (tab: "chats" | "invitations" | "groups") => void;
  inviteCount: number;
  setInviteCount: (count: number | ((prev: number) => number)) => void;
  unreadCounts: Record<string, number>;
  setUnreadCounts: (
    counts:
      | Record<string, number>
      | ((prev: Record<string, number>) => Record<string, number>)
  ) => void;
  chatUsers: any[];
  setChatUsers: (users: any[] | ((prev: any[]) => any[])) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isMobile: boolean;
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  mobileChatOpen: boolean;
  setMobileChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  text: string;
  setText: (text: string) => void;
  search: string;
  setSearch: (search: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  uploadingFile: { name: string; progress: number } | null;
  setUploadingFile: (file: { name: string; progress: number } | null) => void;
  pinnedChats: string[];
  setPinnedChats: (chats: string[]) => void;
  onlineUsers: string[];
  messages: any[];
  groups: any[];
  setGroups: (groups: any[] | ((prev: any[]) => any[])) => void;
  reloadGroups: () => void;
  loadChats: () => Promise<void>;
  logout: () => Promise<void>;
  userId: string | undefined;
  selectedUserObj: any;
  sortedChats: any[];
  handleGroupDeletedFromModal: (groupId: string) => void;
  handleDeleteChat: (chatId: string) => void;
  handleDeleteGroup: (groupId: string) => void;
  handleInvite: (userId: string) => void;
  handleSearch: (val: string) => void;
  toggleMenu: (id: string) => void;
  handleSend: () => Promise<void>;
  handleFileSelect: (file: File) => void;
  handleGroupCreated: (group: any) => void;
  selectPrivateChat: (uName: string, uId: string) => void;
  selectGroupChat: (group: any) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { logout, getUser } = useAuth();

  const [currentUser, setCurrentUser] = useState<any>(() => getUser());
  const userId = currentUser?.id || currentUser?._id;
  const [username, setUsername] = useState(() => currentUser?.username || "");
  const [chatType, setChatType] = useState<ChatType>(
    () => (sessionStorage.getItem("chatType") as ChatType) || "private"
  );
  const [selectedUser, setSelectedUser] = useState<string | null>(() =>
    sessionStorage.getItem("selectedUser")
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() =>
    sessionStorage.getItem("selectedUserId")
  );
  const [selectedGroup, setSelectedGroup] = useState<any | null>(() => {
    const saved = sessionStorage.getItem("selectedGroup");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<
    "chats" | "invitations" | "groups"
  >("chats");
  const [inviteCount, setInviteCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<{
    name: string;
    progress: number;
  } | null>(null);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  {
    /* mobile - laptop - tablet Device sizes  */
  }
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);

      if (!mobile) {
        setShowSidebar(true);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("chatType", chatType);
  }, [chatType]);

  useEffect(() => {
    if (selectedUser) sessionStorage.setItem("selectedUser", selectedUser);
    else sessionStorage.removeItem("selectedUser");
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUserId)
      sessionStorage.setItem("selectedUserId", selectedUserId);
    else sessionStorage.removeItem("selectedUserId");
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedGroup)
      sessionStorage.setItem("selectedGroup", JSON.stringify(selectedGroup));
    else sessionStorage.removeItem("selectedGroup");
  }, [selectedGroup]);

  const { onlineUsers } = useUsers(username);
  const { messages: privateMessages } = useChat(userId, selectedUserId);
  const { groups, setGroups, reloadGroups } = useGroups(userId);
  const { messages: groupMessages } = useGroupChat(
    userId,
    selectedGroup?._id ?? null
  );

  const selectedUserObj = chatUsers.find((u) => u.id === selectedUserId);
  const messages = chatType === "private" ? privateMessages : groupMessages;

  const sortedChats = [...chatUsers].sort((a, b) => {
    const aIndex = pinnedChats.indexOf(a.chatId);
    const bIndex = pinnedChats.indexOf(b.chatId);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  const loadChats = useCallback(async () => {
    if (!userId) return;

    try {
      const data = await api("/api/conversations");

      setChatUsers(data);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api("/api/auth/me");
        if (res.user) {
          const userData = {
            ...res.user,
            id: res.user.id || res.user._id,
          };
          setCurrentUser(userData);
          setUsername(userData.username);
          // Sync with cookie for faster reload next time
          // Cookies.set("userData", JSON.stringify(userData));
        }
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
    if (userId) fetchInviteCount();
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
    const handleClick = () => setActiveMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const handler = ({ conversation }: any) => {
      const otherUser = conversation.participants.find(
        (p: any) => p._id !== userId
      );

      if (!otherUser) return;

      setChatUsers((prev) => {
        // remove existing user first
        const filtered = prev.filter((u) => u.id !== otherUser._id);

        // create updated user object
        const newUser = {
          id: otherUser._id,
          username: otherUser.username,
          lastSeen: otherUser.lastSeen,
          profilePic: otherUser.profilePic,
          chatId: conversation._id,
          lastMessage: "",
        };

        // insert at TOP
        return [newUser, ...filtered];
      });

      setSelectedUserId(otherUser._id);

      setActiveTab("chats");

      setInviteCount(0);
    };

    onInvitationAccepted(handler);

    return () => {
      offInvitationAccepted(handler);
    };
  }, [userId]);

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
    const handler = () => reloadGroups();
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
    const handler = ({ message }: { message: string }) =>
      toast.error(message || "Failed to send invitation");
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

  useEffect(() => {
    const handler = ({
      chatId,
      newLastMessage,
      newLastMessageFileUrl,
      newLastMessageFileType,
    }: any) => {
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
      setChatUsers((prev) => prev.filter((c) => c.chatId !== chatId));
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

  const handleGroupDeletedFromModal = useCallback(
    (groupId: string) => {
      setGroups((prev) =>
        prev.filter((g) => String(g._id) !== String(groupId))
      );
      setSelectedGroup((sg: any) =>
        sg && String(sg._id) === String(groupId) ? null : sg
      );
    },
    [setGroups, setSelectedGroup]
  );

  const handleDeleteChat = (chatId: string) => {
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

  const handleDeleteGroup = (groupId: string) => {
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
    if (user.inviteStatus === "pending") return;
    setSearchResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, inviteStatus: "pending" } : u))
    );
    sendInvitation(userId);

    console.log("handleInvite chatContext");

    goHome();
  };

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api(`/api/users/search?q=${val}`);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMenu = (id: string) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedFile) return;
    try {
      let fileData = null;
      if (selectedFile) {
        setUploadingFile({ name: selectedFile.name, progress: 0 });
        fileData = await uploadChatFile(selectedFile, (progress) => {
          setUploadingFile((prev) => (prev ? { ...prev, progress } : prev));
        });
        setUploadingFile(null);
      }
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
      } else if (chatType === "group" && selectedGroup) {
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

  const handleFileSelect = (file: File) => setSelectedFile(file);

  const selectPrivateChat = (uName: string, uId: string) => {
    setChatType("private");
    setSelectedUser(uName);
    setSelectedUserId(uId);
    setSelectedGroup(null);
    if (window.innerWidth <= 768) {
      setMobileChatOpen(true);
      setShowSidebar(false);
    }
    // if (window.innerWidth <= 768) {
    //   setShowSidebar(false);
    // }

    sessionStorage.setItem("chatType", "private");
    sessionStorage.setItem("selectedUser", uName);
    sessionStorage.setItem("selectedUserId", uId);
    sessionStorage.removeItem("selectedGroup");
  };

  const selectGroupChat = (group: any) => {
    setChatType("group");
    setSelectedGroup(group);
    setSelectedUser(null);
    setSelectedUserId(null);
    if (window.innerWidth <= 768) {
      setMobileChatOpen(true);
      setShowSidebar(false);
    }
    sessionStorage.setItem("chatType", "group");
    sessionStorage.setItem("selectedGroup", JSON.stringify(group));
    sessionStorage.removeItem("selectedUser");
    sessionStorage.removeItem("selectedUserId");
  };

  const handleGroupCreated = (group: any) => {
    reloadGroups();
    selectGroupChat(group);
  };

  useEffect(() => {
    if (!isMobile) return;

    const hasSelectedChat =
      (chatType === "private" && selectedUserId) ||
      (chatType === "group" && selectedGroup);

    if (hasSelectedChat) {
      setMobileChatOpen(true);

      setShowSidebar(false);
    } else {
      setMobileChatOpen(false);

      setShowSidebar(true);
    }
  }, [isMobile, chatType, selectedUserId, selectedGroup]);

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

    const onGroupDeletedSocket = ({ groupId }: { groupId: string }) =>
      handleGroupDeletedFromModal(groupId);
    const onRemovedFromSocket = ({ groupId }: { groupId: string }) =>
      handleGroupDeletedFromModal(groupId);
    socket.on("group:updated", onGroupUpdatedSocket);
    socket.on("group:deleted", onGroupDeletedSocket);
    socket.on("group:removed_from", onRemovedFromSocket);
    return () => {
      socket.off("group:updated", onGroupUpdatedSocket);
      socket.off("group:deleted", onGroupDeletedSocket);
      socket.off("group:removed_from", onRemovedFromSocket);
    };
  }, [handleGroupDeletedFromModal, setGroups, setSelectedGroup]);

  useEffect(() => {
    if (chatType === "group" && !selectedGroup) setChatType("private");
  }, [chatType, selectedGroup]);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        username,
        chatType,
        setChatType,
        selectedUser,
        setSelectedUser,
        selectedUserId,
        setSelectedUserId,
        selectedGroup,
        setSelectedGroup,
        activeTab,
        setActiveTab,
        inviteCount,
        setInviteCount,
        unreadCounts,
        setUnreadCounts,
        chatUsers,
        setChatUsers,
        searchResults,
        setSearchResults,
        activeMenu,
        setActiveMenu,
        sidebarWidth,
        setSidebarWidth,
        isMobile,
        showSidebar,
        setShowSidebar,
        mobileChatOpen,
        setMobileChatOpen,
        text,
        setText,
        search,
        setSearch,
        selectedFile,
        setSelectedFile,
        showModal,
        setShowModal,
        uploadingFile,
        setUploadingFile,
        pinnedChats,
        setPinnedChats,
        onlineUsers,
        messages,
        groups,
        setGroups,
        reloadGroups,
        loadChats,
        logout,
        userId,
        selectedUserObj,
        sortedChats,
        handleGroupDeletedFromModal,
        handleDeleteChat,
        handleDeleteGroup,
        handleInvite,
        handleSearch,
        toggleMenu,
        handleSend,
        handleFileSelect,
        handleGroupCreated,
        selectPrivateChat,
        selectGroupChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
