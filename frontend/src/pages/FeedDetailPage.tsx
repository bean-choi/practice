// src/pages/FeedDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { SAPIBase } from "../api";
import type { Feed } from "../types/feed";
import type { FormEvent } from "react";
import "../styles/feed-detail.css";

interface Place {
  id: string;
  name: string;
  description?: string | null;
  xCoord: number;
  yCoord: number;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
  };
}

interface FeedDetailResponse {
  feed: Feed & {
    place: Place;
    createdAt: string;
    comments: Comment[];
    _count: {
      likes: number;
    };
    // 서버에서 내려줄 수도 있고 안 내려줄 수도 있으니 선택적
    likedByMe?: boolean;
  };
}

const FeedDetailPage: React.FC = () => {
  const { feedId } = useParams<{ feedId: string }>();
  const navigate = useNavigate();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedDetailResponse["feed"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 좋아요 / 댓글 상태
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likedByMe, setLikedByMe] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [togglingLike, setTogglingLike] = useState<boolean>(false);

  // 1) 장소 목록 (좌측 사이드바용)
  useEffect(() => {
    (async () => {
      const res = await fetch(`${SAPIBase}/api/places`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setPlaces(data.places ?? []);
    })();
  }, []);

  // 2) 피드 상세
  useEffect(() => {
    if (!feedId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SAPIBase}/api/feeds/${feedId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setErrorMsg(data?.message ?? "게시물을 불러오지 못했습니다.");
          setLoading(false);
          return;
        }
        const data: FeedDetailResponse = await res.json();
        setFeed(data.feed);
        setSelectedPlaceId(data.feed.placeId);
        setErrorMsg(null);

        // 좋아요 / 댓글 초기화
        setLikeCount(data.feed._count?.likes ?? 0);
        setLikedByMe(data.feed.likedByMe ?? false);
        setComments(data.feed.comments ?? []);
      } catch (e) {
        setErrorMsg("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [feedId]);

  function handleSelectPlace(placeId: string) {
    setSelectedPlaceId(placeId);
  }

  if (!feedId) {
    return <div>잘못된 주소입니다.</div>;
  }

  // 좋아요 토글
  async function handleToggleLike() {
    if (!feed || togglingLike) return;
    setTogglingLike(true);

    try {
      const method = likedByMe ? "DELETE" : "POST";
      const res = await fetch(`${SAPIBase}/api/feeds/${feed.id}/like`, {
        method,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("좋아요 처리 중 오류가 발생했습니다.");
      }

      setLikedByMe((prev) => !prev);
      setLikeCount((prev) => prev + (likedByMe ? -1 : 1));
    } catch (e) {
      console.error(e);
      alert("좋아요 처리에 실패했습니다.");
    } finally {
      setTogglingLike(false);
    }
  }

  // 댓글 작성
  async function handleSubmitComment(e: FormEvent) {
    e.preventDefault();
    if (!feed) return;

    const trimmed = newComment.trim();
    if (!trimmed) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`${SAPIBase}/api/feeds/${feed.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        throw new Error("댓글 작성 중 오류가 발생했습니다.");
      }

      const data = await res.json();
      const created: Comment = data.comment;
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setSubmittingComment(false);
    }
  }

  return (
    <AppLayout
      places={places}
      selectedPlaceId={selectedPlaceId}
      onSelectPlace={handleSelectPlace}
      onClickCreate={() =>
        selectedPlaceId
          ? navigate("/feeds/new", { state: { placeId: selectedPlaceId } })
          : navigate("/feeds/new")
      }
    >
      <div className="feed-detail-page">
        {loading && <div>불러오는 중입니다...</div>}
        {errorMsg && <div className="text-red-500">{errorMsg}</div>}

        {feed && (
          <article className="feed-detail">
            <button
              type="button"
              onClick={() =>
                selectedPlaceId
                  ? navigate(`/places/${selectedPlaceId}/feeds`)
                  : navigate(-1)
              }
              className="feed-detail-back"
            >
              ← 뒤로가기
            </button>

            <header className="feed-detail-header">
              <div className="feed-detail-place">
                {feed.place?.name ?? "장소 없음"}
              </div>

              <h1 className="feed-detail-title">{feed.title}</h1>

              <div className="feed-detail-meta">
                @{feed.author.username} ·{" "}
                {new Date(feed.createdAt).toLocaleString()}
              </div>
            </header>

            {feed.imageKey && (
              <div className="feed-detail-image-wrapper">
                <img
                  src={feed.imageKey}
                  alt={feed.title}
                  className="feed-detail-image"
                />
              </div>
            )}

            {/* 기존 본문 영역: 모양 그대로 유지 */}
            <section className="feed-detail-content">{feed.content}</section>

            {/* ↓↓↓ 스크롤 맨 아래에 보이는 좋아요 + 댓글 UI ↓↓↓ */}

            <section className="feed-detail-actions">
              <button
                type="button"
                className={
                  "feed-like-button" +
                  (likedByMe ? " feed-like-button--active" : "")
                }
                onClick={handleToggleLike}
                disabled={togglingLike}
              >
                {likedByMe ? "좋아요 취소" : "좋아요"} ({likeCount})
              </button>
            </section>

            <section className="feed-comments">
              <h2 className="feed-comments-title">댓글</h2>

              {comments.length === 0 ? (
                <p className="feed-comments-empty">
                  작성된 댓글이 없습니다.
                </p>
              ) : (
                <ul className="feed-comments-list">
                  {comments.map((c) => (
                    <li key={c.id} className="feed-comment-item">
                      <div className="feed-comment-header">
                        <span className="feed-comment-author">
                          {c.author.username}
                        </span>
                        <span className="feed-comment-date">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="feed-comment-content">{c.content}</div>
                    </li>
                  ))}
                </ul>
              )}

              <form
                className="feed-comment-form"
                onSubmit={handleSubmitComment}
              >
                <textarea
                  className="feed-comment-input"
                  placeholder="댓글을 입력하세요."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <button
                  type="submit"
                  className="feed-comment-submit"
                  disabled={
                    submittingComment || newComment.trim().length === 0
                  }
                >
                  {submittingComment ? "작성 중..." : "댓글 작성"}
                </button>
              </form>
            </section>
          </article>
        )}
      </div>
    </AppLayout>
  );
};

export default FeedDetailPage;
