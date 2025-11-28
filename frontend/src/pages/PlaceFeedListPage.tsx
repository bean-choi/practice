// src/pages/PlaceFeedListPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { SAPIBase } from "../api";
import type { Feed, FeedStatus } from "../types/feed";
import "../styles/feed-list.css";

interface Place {
  id: string;
  name: string;
  description?: string | null;
  xCoord: number;
  yCoord: number;
}

const PlaceFeedListPage: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1) 장소 목록 로딩
  useEffect(() => {
    (async () => {
      const res = await fetch(`${SAPIBase}/api/places`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const loaded: Place[] = data.places ?? [];
      setPlaces(loaded);
      if (placeId) {
        setSelectedPlaceId(placeId);
      }
    })();
  }, [placeId]);

  // 2) 해당 장소의 피드 목록 로딩
  useEffect(() => {
    if (!placeId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SAPIBase}/api/places/${placeId}/feeds`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setErrorMsg(data?.message ?? "피드 목록을 불러오지 못했습니다.");
          setFeeds([]);
          return;
        }
        const data = await res.json();
        setFeeds(data.feeds ?? []);
        setErrorMsg(null);
      } catch {
        setErrorMsg("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [placeId]);

  const currentPlace =
    places.find((p) => p.id === placeId) ?? null;

  function handleSelectPlace(id: string) {
    // AppLayout 사이드바에서 다른 장소 선택 시 이동
    if (id === placeId) {
      // 이미 이 페이지 → 아무 것도 안 해도 되지만,
      // 새로고침 느낌을 주고 싶으면 여기서 다시 fetch 해도 됨.
      return;
    }
    navigate(`/places/${id}/feeds`);
  }

  function handleClickFeed(feedId: string) {
    navigate(`/feeds/${feedId}`);
  }

  return (
    <AppLayout
      places={places}
      selectedPlaceId={selectedPlaceId}
      onSelectPlace={handleSelectPlace}
      onClickCreate={() => {
        if (selectedPlaceId) {
          navigate("/feeds/new", { state: { placeId: selectedPlaceId } });
        } else {
          navigate("/feeds/new");
        }
      }}
    >
      <div className="place-feed-page">
        <button
          type="button"
          className="place-feed-back"
          onClick={() => navigate('/map')}
        >
          ← 뒤로가기
        </button>

        <div className="place-feed-card">
          <header className="place-feed-header">
            <div className="place-feed-place-name">
              {currentPlace ? currentPlace.name : "알 수 없는 장소"}
            </div>
            {currentPlace?.description && (
              <div className="place-feed-place-desc">
                {currentPlace.description}
              </div>
            )}
            <h1 className="place-feed-title">이 장소의 피드</h1>
            <p className="place-feed-subtitle">
              왼쪽에서 다른 장소를 선택하면 그 장소의 피드 목록을 볼 수 있어요.
            </p>
          </header>

          {/* 여기부터 스크롤 영역 */}
          <div className="place-feed-scroll">
            {loading && <div className="place-feed-status">불러오는 중입니다...</div>}
            {errorMsg && (
                <div className="place-feed-status place-feed-status-error">
                {errorMsg}
                </div>
            )}

            {!loading && !errorMsg && feeds.length === 0 && (
                <div className="place-feed-status">
                아직 이 장소에 작성된 피드가 없습니다.
                </div>
            )}

            {!loading && !errorMsg && feeds.length > 0 && (
                <ul className="place-feed-list">
                {feeds.map((feed) => (
                    <li key={feed.id}>
                    <button
                        type="button"
                        className="place-feed-item"
                        onClick={() => handleClickFeed(feed.id)}
                    >
                        {feed.imageKey && (
                        <div className="place-feed-thumb-wrapper">
                            <img
                            src={feed.imageKey}
                            alt={feed.title}
                            className="place-feed-thumb"
                            />
                        </div>
                        )}
                        <div className="place-feed-body">
                        <div className="place-feed-item-title">
                            {feed.title || "제목 없는 피드"}
                        </div>
                        <div className="place-feed-item-meta">
                            @{feed.author.username}
                            {feed.status === "PRIVATE"
                            ? " · 비공개"
                            : feed.status === "FRIEND"
                            ? " · 친구 공개"
                            : " · 전체 공개"}
                        </div>
                        <div className="place-feed-item-snippet">
                            {feed.content.length > 80
                            ? feed.content.slice(0, 80) + "..."
                            : feed.content}
                        </div>
                        </div>
                    </button>
                    </li>
                ))}
                </ul>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PlaceFeedListPage;
