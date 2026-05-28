import React from 'react';
// import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../app/ChatContext';

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const SidebarHeader: React.FC = () => {
  // const navigate = useNavigate();
  const { currentUser, username, inviteCount, setActiveTab, setShowModal, logout } = useChatContext();


  return (


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
          // onClick={() => navigate("/settings")}

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


      

      <div className="notification" style={{  display: "flex", gap: "6px", height: "30px" }}>


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
            style={{ color: "rgb(255, 255, 255)" , height: "16px"}}
          ></i>
        </button>




        <button className="logout-btn"  onClick={logout}>
          Logout
        </button>



      </div>



    </div>



  );
};

export default SidebarHeader;
