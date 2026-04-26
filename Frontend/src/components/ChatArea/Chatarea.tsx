import { useRef } from "react";
import { formatLastSeen } from "../../pages/chat/formatLastSeen";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

interface Message {
  _id?: string;
  text: string;
  createdAt?: string;
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
  // selectedUserId,
  selectedGroup,
  messages,
  text,
  onTextChange,
  onSend,
  userId,
  onlineUsers,
  selectedUserObj,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          <div className="chat-header">
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
                    <div className={`msg ${isOwn ? "own" : ""}`}>{m.text}</div>
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
    </div>
  );
}