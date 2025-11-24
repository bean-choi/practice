import React from "react";
import "./App.css";

// 이미지 경로는 실제 파일 경로로 바꿔주세요
import campusMap from "./assets/campus-map.png";
import logo from "./assets/logo.png";
import homeIcon from "./assets/icon-home.png";
import searchIcon from "./assets/icon-search.png";
import notificationIcon from "./assets/icon-notification.png";
import createIcon from "./assets/icon-create.png";
import profileIcon from "./assets/icon-profile.png";
import logoutIcon from "./assets/icon-logout.png";

const App: React.FC = () => {
  return (
    <div className="page">
      {/* 왼쪽: 지도 영역 */}
      <main className="map-area">
        <img src={campusMap} alt="Campus map" className="map-image" />
      </main>

      {/* 오른쪽: 사이드바 */}
      <aside className="sidebar">
        {/* 로고 */}
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="logo-image" />
        </div>

        {/* 메뉴 */}
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <img src={homeIcon} alt="Home" className="nav-icon" />
            <span>Home</span>
          </button>
          <button className="nav-item">
            <img src={searchIcon} alt="Search" className="nav-icon" />
            <span>Search</span>
          </button>
          <button className="nav-item">
            <img src={notificationIcon} alt="Notification" className="nav-icon" />
            <span>Notification</span>
          </button>
          <button className="nav-item">
            <img src={createIcon} alt="Create" className="nav-icon" />
            <span>Create</span>
          </button>
          <button className="nav-item">
            <img src={profileIcon} alt="Profile" className="nav-icon" />
            <span>Profile</span>
          </button>
        </nav>

        {/* 로그아웃 */}
        <div className="sidebar-footer">
          <button className="nav-item logout">
            <img src={logoutIcon} alt="Log out" className="nav-icon" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default App;
