import React from 'react';
import { useChatContext } from '../../app/ChatContext';
import SidebarHeader from './SidebarHeader';
import SearchBar from '../SearchBar/SearchBar';
import UserList from './UserList';
import GroupList from './GroupList';
import InvitationList from '../InvitationList/InvitationList';

const Sidebar: React.FC = () => {
  const { 
    sidebarWidth, setSidebarWidth, search, handleSearch, searchResults, 
    handleInvite, activeTab, setActiveTab, loadChats, setSearchResults, setSearch
  } = useChatContext();

  const isResizing = React.useRef(false);

  const startResizing = () => {
    isResizing.current = true;
  };

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
  }, []);

  const resize = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth < 200 || newWidth > 500) return;
    setSidebarWidth(newWidth);
  }, [setSidebarWidth]);

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
    <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
      <SidebarHeader />
      <SearchBar value={search} onChange={handleSearch} placeholder="Search users..." />

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

      {/* <div className="tabs">
        <button
          className={activeTab === "chats" ? "active" : ""}
          onClick={() => setActiveTab("chats")}
        >
          Chats
        </button>
        <button
          className={activeTab === "invitations" ? "active" : ""}
          onClick={() => setActiveTab("invitations")}
        >
          Invitations
        </button>
      </div> */}

      <div className="sidebar-content">
        {activeTab === "invitations" ? (
          <InvitationList
            onBack={() => setActiveTab("chats")}
            onAccept={goHome}
          />
        ) : (
          <div className="user-list">
            <UserList />
            <GroupList />
          </div>
        )}
      </div>

      <div className="resizer" onMouseDown={startResizing} />
    </div>
  );
};

export default Sidebar;
