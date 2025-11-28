// src/pages/MapPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SAPIBase } from "../api";
import AppLayout from "../components/AppLayout";
import type { Place } from "../components/AppLayout";
import type { FeedStatus } from "../types/feed";
import type { Feed, Author } from "../types/feed";
import { Link } from "react-router-dom";
import "../styles/map.css";

const BASE_MAP_WIDTH = 2171;  // 캠퍼스 맵 원본 이미지 가로(px)에 맞춰 수정
const BASE_MAP_HEIGHT = 1713; // 세로(px)에 맞춰 수정


const DEFAULT_STATUS: FeedStatus = "PUBLIC";

const MapPage: React.FC = () => {
  const navigate = useNavigate();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCounts, setRecentCounts] = useState<Record<string, number>>({});

  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [feedsError, setFeedsError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // 1) 인증 확인 (로그인 안 되어 있으면 /login 으로)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${SAPIBase}/api/auth/me`, {
          credentials: "include",
        });
        if (res.status === 401) {
          navigate("/login", { replace: true });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [navigate]);

  // 2) 장소 목록 로딩
  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${SAPIBase}/api/places`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message ?? "장소 목록을 불러오지 못했습니다.");
        }
        const data = await res.json();
        if (!cancelled) {
          const list: Place[] = data.places ?? [];
          setPlaces(list);
          if (list.length > 0) {
            setSelectedPlaceId(list[0].id);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? "알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (places.length === 0) return;

    let cancelled = false;

    async function loadRecentCounts() {
      const entries: [string, number][] = [];

      for (const place of places) {
        try {
          const res = await fetch(
            `${SAPIBase}/api/places/${place.id}/feeds`,
            { credentials: "include" }
          );

          if (!res.ok) {
            continue;
          }

          const data = await res.json();
          // 백엔드 응답 형식에 맞게 feeds 배열을 꺼냅니다.
          // 예: { feeds: [...] } 라고 가정
          const feeds = data.feeds ?? [];
          entries.push([place.id, feeds.length]);
        } catch (e) {
          console.error(e);
        }
      }

      if (!cancelled) {
        setRecentCounts(Object.fromEntries(entries));
      }
    }

    loadRecentCounts();

    return () => {
      cancelled = true;
    };
  }, [places]);

  // 선택된 장소의 최근 24시간 피드를 가져오는 효과
  useEffect(() => {
    if (!selectedPlaceId) {
      setFeeds([]);
      setIsPanelOpen(false);
      return;
    }

    let cancelled = false;

    async function loadFeeds() {
      setLoadingFeeds(true);
      setFeedsError(null);
      setIsPanelOpen(true);

      try {
        const res = await fetch(
          `${SAPIBase}/api/places/${selectedPlaceId}/feeds`,
          { credentials: "include" }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message ?? "피드를 불러오지 못했습니다.");
        }

        const data = await res.json();
        // 응답 구조에 맞게 수정. 여기서는 { feeds: [...] } 라고 가정
        const list: Feed[] = data.feeds ?? [];

        if (!cancelled) {
          setFeeds(list);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setFeedsError(e.message ?? "알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoadingFeeds(false);
        }
      }
    }

    loadFeeds();

    return () => {
      cancelled = true;
    };
  }, [selectedPlaceId]);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  // 장소 선택 핸들러 (레이아웃의 장소 목록에서 호출 예정)
  function handleSelectPlace(placeId: string) {
    setSelectedPlaceId(placeId);
  }

  function handleClickFeedCard(feedId: string) {
    navigate(`/feeds/${feedId}`);
  }


  return (
    <AppLayout
      places={places}
      selectedPlaceId={selectedPlaceId}
      onSelectPlace={handleSelectPlace}
    >
      {/* 오른쪽 맵 영역 */}
      <div className="map-main">
        <div className="map-main-inner">
          {loading && <p className="map-muted">장소를 불러오는 중...</p>}
          {error && <p className="map-error-text">{error}</p>}

          {!loading && !error && (
            <div className="map-outer">
              <div className="map-image-wrapper">
                <img src="/campus-map.png" alt="Campus map" className="map-image" />

                {places.map((place) => {
                  const leftPercent = (place.xCoord / BASE_MAP_WIDTH) * 100;
                  const topPercent = (place.yCoord / BASE_MAP_HEIGHT) * 100;

                  const active = place.id === selectedPlaceId;

                  const pinSrc = active ? "/pin-active.png" : "/pin-nonactive.png";

                  return (
                    <button
                      key={place.id}
                      type="button"
                      className="map-pin-img"
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                      }}
                      onClick={() => {
                        handleSelectPlace(place.id);
                        setIsPanelOpen(true);
                      }}
                    >
                      <img src={pinSrc} className="pin-image" alt="pin" />

                      {/* 숫자 표시 (흰 원 안에 들어감) */}
                      <span className="pin-count">
                        {recentCounts[place.id] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
              {isPanelOpen && selectedPlace && (
                <div className="map-place-panel">
                  <div className="map-place-panel-header">
                    <div>
                      <Link to={`/places/${selectedPlaceId}/feeds`} >{selectedPlace.name}</Link>
                      <div className="map-place-panel-sub">
                        최근 24시간 게시물 {feeds.length}개
                      </div>
                    </div>
                    <button
                      type="button"
                      className="map-place-panel-close"
                      onClick={() => setIsPanelOpen(false)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="map-place-panel-body">
                    {loadingFeeds && (
                      <p className="map-muted">게시물을 불러오는 중...</p>
                    )}
                    {feedsError && (
                      <p className="map-error-text">{feedsError}</p>
                    )}
                    {!loadingFeeds && !feedsError && feeds.length === 0 && (
                      <p className="map-muted">최근 24시간 내 게시물이 없습니다.</p>
                    )}

                    {!loadingFeeds && !feedsError && feeds.length > 0 && (
                      <div className="map-feed-grid">
                        {feeds.slice(0, 4).map((feed) => (
                          <button
                            type="button"
                            key={feed.id}
                            className="map-feed-card"
                            onClick={() => handleClickFeedCard(feed.id)}
                          >
                            <div className="map-feed-thumb">
                              {feed.imageKey ? (
                                <img
                                  src={feed.imageKey}
                                  alt={feed.title}
                                  className="map-feed-thumb-img"
                                />
                              ) : (
                                <div className="map-feed-thumb-placeholder">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="map-feed-caption">
                              <div className="feed-title">{feed.title}</div>
                              <div className="feed-author">@{feed.author.username}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default MapPage;
