import React from "react";
import { useChatContext } from "../../app/ChatContext";
import SidebarHeader from "./SidebarHeader";
import SearchBar from "../SearchBar/SearchBar";
import UserList from "./UserList";
import GroupList from "./GroupList";
import InvitationList from "../InvitationList/InvitationList";
import "../../pages/chat/chat.css";

const Sidebar: React.FC = () => {
  const {
    sidebarWidth,
    setSidebarWidth,
    showSidebar,
    setShowSidebar,
    isMobile,
    search,
    handleSearch,
    searchResults,
    inviteCount,
    handleInvite,
    activeTab,
    setActiveTab,
    loadChats,
    setSearchResults,
    setSearch,
  } = useChatContext();

  const isResizing = React.useRef(false);

  const startResizing = () => {
    isResizing.current = true;
  };

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX;
      if (newWidth < 200 || newWidth > 500) return;
      setSidebarWidth(newWidth);
    },
    [setSidebarWidth]
  );

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const goHome = React.useCallback(() => {
    setActiveTab("chats");
    setSearch("");
    setSearchResults([]);
    loadChats();
  }, [loadChats, setActiveTab, setSearch, setSearchResults]);

  return (

    <>

    {isMobile && showSidebar && (
  <div
    className="mobile-overlay"
    onClick={() => setShowSidebar(false)}
  />
)}
    <div
      className={`sidebar ${showSidebar ? "mobile-open" : ""}`}
      style={{
        width: isMobile ? "100vw" : `${sidebarWidth}px`,
      }}
    >
      {/* {isMobile && showSidebar && (
        <div className="mobile-overlay" onClick={() => setShowSidebar(false)} />
      )} */}

      <SidebarHeader />

      <SearchBar
        value={search}
        onChange={handleSearch}
        placeholder="Search users..."
      />

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
                <button onClick={() => handleInvite(u.id)}>Invite</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="tabs">
        <button
          className={activeTab === "chats" ? "active" : ""}
          onClick={() => setActiveTab("chats")}
        >
          All
        </button>

        <button
          className={activeTab === "groups" ? "active" : ""}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </button>

        <button
          className={activeTab === "invitations" ? "active" : ""}
          onClick={() => setActiveTab("invitations")}
        >
          Invitations
          <span>{inviteCount > 0 && <span>({inviteCount})</span>}</span>
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === "chats" && (
          <div className="user-list">
            <UserList />
          </div>
        )}

        {activeTab === "groups" && (
          <div className="user-list">
            <GroupList />
          </div>
        )}

        {activeTab === "invitations" && (
          <InvitationList
            onBack={() => setActiveTab("chats")}
            onAccept={goHome}
          />
        )}
      </div>

      <div className="footer">
        <button onClick={() => setActiveTab("chats")}>Go Home</button>

        <button>hsj</button>
      </div>

      <div className="resizer" onMouseDown={startResizing} />
    </div>

    </>
  );
};

export default Sidebar;
