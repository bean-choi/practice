// src/components/AppLayout.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SAPIBase } from "../api";
import "../styles/layout.css";

export interface Place {
  id: string;
  name: string;
  description?: string | null;
  xCoord: number;
  yCoord: number;
}

interface AppLayoutProps {
  children: React.ReactNode;

  // 왼쪽 사이드바에 보여줄 장소 목록
  places: Place[];

  // 현재 선택된 장소 id (없으면 null)
  selectedPlaceId: string | null;

  // 장소 클릭 시 호출되는 핸들러
  onSelectPlace?: (placeId: string) => void;

  // 상단 메뉴의 "Create" 버튼 클릭 시 호출되는 핸들러
  onClickCreate?: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  places,
  selectedPlaceId,
  onSelectPlace,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;

  const isHome = path.startsWith("/map");
  const isNotification = path.startsWith("/notifications");
  const isCreate = path.startsWith("/feeds/new");
  const isProfile = path.startsWith("/profile");

  async function handleLogout() {
    try {
      await fetch(`${SAPIBase}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error(e);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="app-layout">
      {/* 왼쪽 사이드바 */}
      <aside className="app-sidebar">
        {/* 로고 */}
        <div className="app-sidebar-logo">
          <h1 className="app-logo-text">Example Logo</h1>
        </div>

        {/* 상단 메뉴 */}
        <nav className="app-nav">
          <button
            type="button"
            className={
              "app-nav-item" + (isHome ? " app-nav-item--active" : "")
            }
            onClick={() => navigate("/")}
          >
            <span className="app-nav-label">Home</span>
          </button>

          <button
            type="button" 
            className={
              "app-nav-item" + (isNotification ? " app-nav-item--active" : "")
            }
          >
            <span className="app-nav-label">Notification</span>
          </button>

          {/* 여기 Create 버튼에 props로 받은 핸들러 연결 */}
          <button
            type="button"
            className={
              "app-nav-item" + (isCreate ? " app-nav-item--active" : "")
            }
            onClick={() => navigate("/feeds/new", {
              state: { placeId: selectedPlaceId },
            })}
          >
            <span className="app-nav-label">Create</span>
          </button>

          <button
            type="button"
            className={
              "app-nav-item" + (isProfile ? " app-nav-item--active" : "")
            }
          >
            <span className="app-nav-label">Profile</span>
          </button>
        </nav>

        {/* 장소 목록 섹션 */}
        <section className="app-places-section">
          <h2 className="app-places-title">Places</h2>
          {places.length === 0 ? (
            <p className="app-muted">등록된 장소가 없습니다.</p>
          ) : (
            <ul className="app-places-list">
              {places.map((place) => {
                const active = place.id === selectedPlaceId;
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      className={
                        "app-place-item" +
                        (active ? " app-place-item--active" : "")
                      }
                      onClick={() => onSelectPlace?.(place.id)}
                    >
                      <div className="app-place-name">{place.name}</div>
                      {place.description && (
                        <div className="app-place-desc">
                          {place.description}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 맨 아래 로그아웃 */}
        <div className="app-logout-area">
          <button
            type="button"
            className="app-logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>

      {/* 오른쪽 메인 영역 */}
      <main className="app-main">{children}</main>
    </div>
  );
};

export default AppLayout;
