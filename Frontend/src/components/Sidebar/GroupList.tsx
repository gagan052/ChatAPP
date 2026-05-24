import React from 'react';
import { useChatContext } from '../../app/ChatContext';

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const GroupList: React.FC = () => {
  const { 
    groups, chatType, selectedGroup, 
    handleDeleteGroup, toggleMenu, activeMenu, selectGroupChat 
  } = useChatContext();

  return (
    <>
      {groups.length > 0 && (
        <>
          <p className="list-section-label">Groups</p>
          {groups.map((g: any) => {
            const isActive = chatType === "group" && selectedGroup?._id === g._id;
            const hasLastFile = g.lastMessage?.fileUrl;
            const isLastImage = g.lastMessage?.fileType?.startsWith("image");
            const isLastVideo = g.lastMessage?.fileType?.startsWith("video");

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
                  {!g.groupInfo?.avatar && getInitials(g.groupInfo?.name || "G")}
                </div>

                <div className="user-meta">
                  <div className="user-name">{g.groupInfo?.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {hasLastFile && (
                      isLastImage ? <i className="fa-solid fa-image" style={{ color: "var(--color-text-faint)" }}></i>
                      : isLastVideo ? <i className="fa-solid fa-video" style={{ color: "var(--color-text-faint)" }}></i>
                      : <i className="fa-solid fa-file" style={{ color: "var(--color-text-faint)" }}></i>
                    )}
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
                      {g.lastMessage?.text || (hasLastFile ? "📎 File" : `${g.participants?.length || 0} members`)}
                    </span>
                  </div>
                </div>
                <div
                  className="group-menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(g._id);
                  }}
                  style={{ border: "none", cursor: "pointer", position: "relative" }}
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                  {activeMenu === g._id && (
                    <div className="menu-dropdown">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(g._id);
                          toggleMenu(null as any);
                        }}
                        style={{ color: "var(--color-error)" }}
                      >
                        Delete Group
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
};

export default GroupList;
