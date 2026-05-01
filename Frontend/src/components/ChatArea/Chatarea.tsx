import { useRef, useState, useEffect } from "react";
import { formatLastSeen } from "../../pages/chat/formatLastSeen";
import ChatInfoModal from "../ChatInfoModal/ChatInfoModal";
import {
  editMessage,
  deleteMessageSocket,
  clearChatSocket,
  joinChatRoom,
} from "../../features/chat/socket";
import { toast } from "react-toastify";
import "./ChatArea.css";
import { socket } from "../../services/socket";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

interface Message {
  _id?: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: string;
  isEdited?: boolean;
  sender:
    | {
        _id?: string;
        id?: string;
        username?: string;
        profilePic?: string;
      }
    | string;

  status?: {
    userId: string;
    delivered?: string;
    seen?: string;
  }[];
}

interface ChatUser {
  id: string;
  username: string;
  lastSeen?: string;
  profilePic?: string;
}

interface Group {
  _id: string;
  groupInfo?: { 
    name: string; 
    admin?: { _id: string; username: string; profilePic?: string };
    avatar?: string;
  };
  participants?: any[];
}

interface ChatAreaProps {
  chatType: "private" | "group";
  selectedUser: string | null;
  selectedUserId: string | null;
  selectedGroup: Group | null;
  chatId: string | null;
  messages: Message[];
  text: string;
  onTextChange: (val: string) => void;
  onSend: () => void;
  onFileSelect?: (file: File) => void;
  selectedFile?: File | null;
  onClearSelectedFile?: () => void;
  userId: string;
  onlineUsers: string[];
  selectedUserObj?: ChatUser;
  onGroupUpdated?: (updatedGroup: any) => void;
}

export default function ChatArea({
  chatType,
  selectedUser,
  selectedUserId,
  selectedGroup,
  chatId,
  messages,
  text,
  onTextChange,
  onSend,
  onFileSelect,
  selectedFile,
  onClearSelectedFile,
  userId,
  onlineUsers,
  selectedUserObj,
  onGroupUpdated,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (!chatId) return;

    joinChatRoom(chatId);

    socket.emit("mark_seen", {
      chatId,
      userId,
    });
  }, [chatId]);

  const handleEdit = (m: Message) => {
    if (!m._id) return;
    setEditingId(m._id);
    setEditText(m.text);
  };

  const submitEdit = () => {
    if (!editingId || !editText.trim()) return;
    editMessage(
      editingId,
      editText.trim(),
      chatType === "private" ? selectedUserId || undefined : undefined,
      chatType === "group"
    );
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = (messageId: string) => {
    if (!window.confirm("Delete this message?")) return;
    deleteMessageSocket(
      messageId,
      chatType === "private" ? selectedUserId || undefined : undefined,
      chatType === "group"
    );
  };

  const handleClear = () => {
    if (!chatId) return;

    if (!toast.isActive("clear-chat-confirm")) {
      toast.info(
        <div>
          Are you sure you want to clear all messages? This cannot be undone.
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => {
                toast.dismiss("clear-chat-confirm");

                clearChatSocket(
                  chatId,
                  chatType === "private"
                    ? selectedUserId || undefined
                    : undefined,
                  chatType === "group"
                );
              }}
            >
              Yes, Clear
            </button>

            <button onClick={() => toast.dismiss("clear-chat-confirm")}>
              Cancel
            </button>
          </div>
        </div>,
        { toastId: "clear-chat-confirm", autoClose: false }
      );
    }
  };

  const headerName =
    chatType === "private" ? selectedUser : selectedGroup?.groupInfo?.name;

  const headerInitials = headerName ? getInitials(headerName) : "";

  const isOnline =
    chatType === "private" &&
    selectedUser &&
    onlineUsers.includes(selectedUser || "");

  return (
    <div className="chat-area">
      {headerName ? (
        <>
          {/* Header */}
          <div
            className="chat-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              onClick={() => setShowInfoModal(true)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flex: 1,
              }}
            >
              <div
                className={`chat-header-avatar ${
                  chatType === "group" ? "group-avatar" : ""
                }`}
                style={{
                  background:
                    chatType === "private" && selectedUserObj?.profilePic
                      ? `url(${selectedUserObj.profilePic}) center/cover`
                      : chatType === "group" && selectedGroup?.groupInfo?.avatar
                      ? `url(${selectedGroup.groupInfo.avatar}) center/cover`
                      : "var(--color-accent-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {!(
                  (chatType === "private" && selectedUserObj?.profilePic) ||
                  (chatType === "group" && selectedGroup?.groupInfo?.avatar)
                ) && headerInitials}
              </div>
              <div>
                <div className="chat-header-name">{headerName}</div>
                {chatType === "private" ? (
                  isOnline ? (
                    <div className="chat-header-status">online</div>
                  ) : (
                    <div className="chat-header-offline">
                      {formatLastSeen(selectedUserObj?.lastSeen)}
                    </div>
                  )
                ) : (
                  <div className="chat-header-offline">
                    {selectedGroup?.participants?.length} members
                  </div>
                )}
              </div>
            </div>

            <button
              className="clear-chat-btn"
              onClick={handleClear}
              title="Clear all messages"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "var(--color-text-faint)",
                transition: "color 0.2s",
              }}
            >
              Clear Chat{" "}
              <i
                className="fa-solid fa-trash"
                style={{ color: "rgb(24, 60, 233)", fontSize: "20px" }}
              ></i>
            </button>
          </div>

          {/* Messages */}
          <div className="messages">
            {messages.map((m, i) => {
              const senderObj = m.sender;
              const msgSenderId = String(
                (senderObj as any)?._id ?? (senderObj as any)?.id ?? senderObj
              );
              const isOwn = msgSenderId === userId;
              const senderName = (senderObj as any)?.username ?? "";
              const senderPic =
                (senderObj as any)?.profilePic ??
                (msgSenderId === selectedUserId
                  ? selectedUserObj?.profilePic
                  : null);

              return (
                <div
                  key={(m._id as string) || i}
                  className={`msg-row ${isOwn ? "own" : ""}`}
                >
                  {!isOwn && (
                    <div
                      className="msg-bubble-avatar"
                      style={{
                        background: senderPic
                          ? `url(${senderPic}) center/cover`
                          : "var(--color-accent-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {!senderPic &&
                        getInitials(senderName || selectedUser || "?")}
                    </div>
                  )}
                  <div className={`msg-wrap ${isOwn ? "own" : "other"}`}>
                    {!isOwn && chatType === "group" && senderName && (
                      <div className="msg-sender-name">{senderName}</div>
                    )}
                    {editingId === m._id ? (
                      <div className="msg-edit-input">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <div className="msg-edit-actions">
                          <button onClick={submitEdit}>Save</button>
                          <button onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`msg ${isOwn ? "own" : ""}`}>
                          {m.fileUrl ? (
                            <>
                              {m.fileType?.startsWith("image") ? (
                                <img
                                  src={m.fileUrl}
                                  className="chat-image"
                                  alt="chat image"
                                />
                              ) : m.fileType?.startsWith("video") ? (
                                <video
                                  controls
                                  src={m.fileUrl}
                                  className="chat-video"
                                />
                              ) : (
                                <a
                                  href={m.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="file-link"
                                >
                                  <i className="fa-solid fa-file"></i>
                                  Download File
                                </a>
                              )}
                              {m.text && (
                                <div style={{ marginTop: "8px" }}>{m.text}</div>
                              )}
                            </>
                          ) : (
                            <>
                              {m.text}
                              {m.isEdited && (
                                <span className="msg-edited-tag">(edited)</span>
                              )}
                            </>
                          )}
                        </div>
                        {isOwn && m._id && (
                          <div className="msg-actions">
                            {(() => {
                              const otherStatuses = m.status?.filter(
                                (s: any) => String(s.userId) !== String(userId)
                              );
                              const isSeen = otherStatuses?.some((s: any) => s.seen);
                              
                              if (!isSeen) {
                                return (
                                  <button onClick={() => handleEdit(m)} title="Edit">
                                    <i
                                      className="fa-solid fa-pen-to-square"
                                      style={{
                                        color: "rgb(122, 140, 231)",
                                        fontSize: "13px",
                                      }}
                                    ></i>
                                  </button>
                                );
                              }
                              return null;
                            })()}
                            <button
                              onClick={() => handleDelete(m._id!)}
                              title="Delete"
                            >
                              <i
                                className="fa-solid fa-trash"
                                style={{
                                  color: "rgb(122, 140, 231)",
                                  fontSize: "13px",
                                }}
                              ></i>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <div className="msg-time">
                      <span>
                        {new Date(m.createdAt || Date.now()).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>

                      {isOwn && (
                        <span className="msg-status">
                          {(() => {
                            const otherStatuses = m.status?.filter(
                              (s: any) => String(s.userId) !== String(userId)
                            );

                            if (!otherStatuses || otherStatuses.length === 0)
                              return "✓";

                            const anySeen = otherStatuses.some(
                              (s: any) => s.seen
                            );
                            if (anySeen) {
                              return (
                                <i
                                  className="fa-solid fa-check-double"
                                  style={{ color: "#34b7f1" }}
                                  title="Seen"
                                ></i>
                              );
                            }

                            const anyDelivered = otherStatuses.some(
                              (s: any) => s.delivered
                            );
                            if (anyDelivered) {
                              return (
                                <i
                                  className="fa-solid fa-check-double"
                                  style={{ color: "var(--color-text-faint)" }}
                                  title="Delivered"
                                ></i>
                              );
                            }

                            return "✓";
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Selected file preview */}
          {selectedFile && (
            <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid var(--color-border)" }}>
              <i className="fa-solid fa-file" style={{ color: "var(--color-accent)" }}></i>
              <span style={{ flex: 1, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedFile.name}
              </span>
              <button
                onClick={onClearSelectedFile}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)" }}
                title="Remove file"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
          )}

          {/* Input */}
          <div className="chat-input">
            <div className="file-uploader">
              <input
                type="file"
                style={{ display: "none" }}
                id="fileInput"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                multiple={false}
                onChange={(e) => {
                  if (e.target.files?.[0] && onFileSelect) {
                    onFileSelect(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
              <label htmlFor="fileInput" className="file-upload-btn" title="Attach file">
                <i className="fa-solid fa-paperclip"></i>
              </label>
            </div>
            <input
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder={
                chatType === "group"
                  ? `Message ${selectedGroup?.groupInfo?.name}...`
                  : "Type a message..."
              }
            />
            <button className="send-btn" onClick={onSend}>
              <svg viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        /* Empty state */
        <div className="empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p>Select a chat or create a group</p>
        </div>
      )}

      {showInfoModal && (
        <ChatInfoModal
          chatType={chatType}
          selectedUser={selectedUser}
          selectedUserObj={selectedUserObj}
          selectedGroup={selectedGroup}
          currentUserId={userId}
          onClose={() => setShowInfoModal(false)}
          onGroupUpdated={onGroupUpdated}
        />
      )}
    </div>
  );
}
