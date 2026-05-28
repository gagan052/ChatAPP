import { useState } from "react";
import {
  FaRegHeart,
  FaRegStar,
  FaHistory,
  FaUserLock,
  FaLock,
  FaComments,
  FaBell,
  FaArrowUp,
  FaQuestionCircle,
  FaCamera,
} from "react-icons/fa";

import "./settings.css";

export default function SettingsPage() {
  const [selectedMenu, setSelectedMenu] = useState("Profile");

  const menuItems = [
    {
      label: "Favourites",
      icon: <FaRegHeart />,
    },
    {
      label: "Starred",
      icon: <FaRegStar />,
    },
    {
      label: "Chat history",
      icon: <FaHistory />,
    },
    {
      label: "Account",
      icon: <FaUserLock />,
    },
    {
      label: "Privacy",
      icon: <FaLock />,
    },
    {
      label: "Chats",
      icon: <FaComments />,
    },
    {
      label: "Notifications",
      icon: <FaBell />,
    },
    {
      label: "Storage and data",
      icon: <FaArrowUp />,
    },
    {
      label: "Help",
      icon: <FaQuestionCircle />,
    },
  ];

  return (
    <div className="settings-overlay">
      <div className="settings-modal">

        {/* LEFT SIDEBAR */}

        <div className="settings-sidebar">
          <div className="settings-header">
            <h2>Settings</h2>
          </div>

          <div className="settings-search">
            <input type="text" placeholder="Search" />
          </div>

          <div className="profile-mini-card">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="profile"
            />

            <span>Gagan</span>
          </div>

          <div className="settings-menu">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={`menu-item ${
                  selectedMenu === item.label ? "active" : ""
                }`}
                onClick={() => setSelectedMenu(item.label)}
              >
                <span className="menu-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT CONTENT */}

        <div className="settings-content">
          <div className="content-header">
            <h2>Profile</h2>
          </div>

          <div className="profile-photo-section">
            <div className="profile-photo-wrapper">
              <img
                src="https://i.pravatar.cc/300?img=12"
                alt="profile"
              />

              <button className="edit-photo-btn">
                <FaCamera />
              </button>
            </div>

            <button className="edit-photo-text">
              Edit photo
            </button>
          </div>

          <div className="settings-fields">

            <div className="field-group">
              <label>About</label>

              <div className="field-box">
                <span>
                  Hey there! I am using Zynk.
                </span>
              </div>
            </div>

            <div className="field-group">
              <label>Name</label>

              <div className="field-box">
                <span>Gagan</span>
              </div>
            </div>

            <div className="field-group">
              <label>Phone number</label>

              <div className="field-box">
                <span>+91 97284 22008</span>
              </div>
            </div>
          </div>

          <button className="logout-btn">
            Log out
          </button>

          <div className="settings-footer">
            <button className="done-btn">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}