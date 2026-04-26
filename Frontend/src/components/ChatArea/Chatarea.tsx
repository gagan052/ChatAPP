import { useRef, useState } from "react";
import { formatLastSeen } from "../../pages/chat/formatLastSeen";
import ChatInfoModal from "../ChatInfoModal/ChatInfoModal";
import { editMessage, deleteMessageSocket, clearChatSocket } from "../../features/chat/socket";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

interface Message {
  _id?: string;
  text: string;
  createdAt?: string;
  isEdited?: boolean;
  sender: {
    _id?: string;
    id?: string;
    username?: string;
  } | string;
}

interface ChatUser {
  id: string;
  username: string;
  lastSeen?: string;
}

interface Group {
  _id: string;
  groupInfo?: { name: string };
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
  userId: string;
  onlineUsers: string[];
  selectedUserObj?: ChatUser;
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
  userId,
  onlineUsers,
  selectedUserObj,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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
    if (!window.confirm("Are you sure you want to clear all messages? This cannot be undone.")) return;
    clearChatSocket(
      chatId,
      chatType === "private" ? selectedUserId || undefined : undefined,
      chatType === "group"
    );
  };

  const headerName =
    chatType === "private" ? selectedUser : selectedGroup?.groupInfo?.name;

  const headerInitials = headerName ? getInitials(headerName) : "";

  const isOnline =
    chatType === "private" &&
    selectedUser &&
    onlineUsers.includes(selectedUser);

  return (
    <div className="chat-area">
      {headerName ? (
        <>
          {/* Header */}
          <div
            className="chat-header"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div 
              onClick={() => setShowInfoModal(true)} 
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", flex: 1 }}
            >
              <div
                className={`chat-header-avatar ${
                  chatType === "group" ? "group-avatar" : ""
                }`}
              >
                {headerInitials}
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
                transition: "color 0.2s"
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                width="20" 
                height="20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="messages">
            {messages.map((m, i) => {
              const senderObj = m.sender;
              const msgSenderId = String(
                (senderObj as any)?._id ??
                  (senderObj as any)?.id ??
                  senderObj
              );
              const isOwn = msgSenderId === userId;
              const senderName = (senderObj as any)?.username ?? "";

              return (
                <div
                  key={(m._id as string) || i}
                  className={`msg-row ${isOwn ? "own" : ""}`}
                >
                  {!isOwn && (
                    <div className="msg-bubble-avatar">
                      {getInitials(senderName || selectedUser || "?")}
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
                          <button onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`msg ${isOwn ? "own" : ""}`}>
                          {m.text}
                          {m.isEdited && <span className="msg-edited-tag">(edited)</span>}
                        </div>
                        {isOwn && m._id && (
                          <div className="msg-actions">
                            <button onClick={() => handleEdit(m)} title="Edit">
                              ✎
                            </button>
                            <button onClick={() => handleDelete(m._id!)} title="Delete">
                              🗑
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <div className="msg-time">
                      {new Date(m.createdAt || Date.now()).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input">
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
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
}