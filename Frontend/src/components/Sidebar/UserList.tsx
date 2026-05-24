import React from 'react';
import { useChatContext } from '../../app/ChatContext';
import { togglePinChat } from '../../features/utils/pinChats';

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const UserList: React.FC = () => {
  const { 
    sortedChats, chatType, selectedUserId, setSelectedUserId, setChatType, 
    setSelectedUser, unreadCounts, activeMenu, pinnedChats, 
    setPinnedChats, toggleMenu, handleDeleteChat, selectPrivateChat
  } = useChatContext();

  const handleTogglePin = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    const updated = togglePinChat(chatId);
    setPinnedChats(updated);
  };

  return (
    <>
      <p className="list-section-label">Recent Chats</p>
      {sortedChats.map((u) => {
        const isActive = chatType === "private" && selectedUserId === u.id;
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    position: "relative",
                  }}
                >
                  {unreadCounts[u.id] > 0 && (
                    <div className="unread-badge">{unreadCounts[u.id]}</div>
                  )}
                  <div
                    className="chat-menu"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(u.id);
                    }}
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    {pinnedChats.includes(u.chatId) && (
                      <i className="fa-solid fa-thumbtack" style={{ marginLeft: 6, fontSize: "12px" }}></i>
                    )}
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                    {activeMenu === u.id && (
                      <div className="menu-dropdown">
                        <button onClick={(e) => handleTogglePin(e, u.chatId)}>
                          {pinnedChats.includes(u.chatId) ? "Unpin Chat" : "Pin Chat"}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(u.chatId); }} style={{ color: "var(--color-error)" }}>
                          Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {hasLastFile && (
                  isLastImage ? <i className="fa-solid fa-image" style={{ color: "var(--color-text-faint)" }}></i>
                  : isLastVideo ? <i className="fa-solid fa-video" style={{ color: "var(--color-text-faint)" }}></i>
                  : <i className="fa-solid fa-file" style={{ color: "var(--color-text-faint)" }}></i>
                )}
                <span className="last-message">
                  {u.lastMessage || (hasLastFile ? "📎 File" : "No messages yet")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default UserList;
