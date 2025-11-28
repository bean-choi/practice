// src/pages/CreateFeedPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { SAPIBase } from "../api";
import type { FeedStatus } from "../types/feed";
import "../styles/create-feed.css";

interface Place {
  id: string;
  name: string;
  description?: string | null;
  xCoord: number;
  yCoord: number;
}

interface CreateFeedLocationState {
  placeId?: string;
}

const DEFAULT_STATUS: FeedStatus = "PUBLIC";

const CreateFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { placeId?: string } };
  
  const state = location.state as CreateFeedLocationState | null;

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<FeedStatus>(DEFAULT_STATUS);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1) 장소 목록 불러오기
  useEffect(() => {
    (async () => {
      const res = await fetch(`${SAPIBase}/api/places`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setPlaces(data.places ?? []);

      // Map에서 넘어올 때 placeId를 state로 넘겼다면 기본 선택
      const fromMapId = state?.placeId;
      if (fromMapId) {
        setSelectedPlaceId(fromMapId);
      }
    })();
  }, [state?.placeId]);

  // 2) 사이드바에서 장소 선택
  function handleSelectPlace(placeId: string) {
    setSelectedPlaceId(placeId);
  }

  // 3) 파일 선택
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  // 4) 피드 생성 + 이미지 업로드
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedPlaceId) {
      alert("먼저 왼쪽에서 장소를 선택하세요.");
      return;
    }
    if (!title.trim()) {
        alert("제목을 입력하세요.");
        return;
    }
    if (!content.trim()) {
      alert("내용을 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageKey: string | null = null;

      // (1) 이미지가 있으면 presigned URL 요청 + S3 업로드
      if (file) {
        const presignRes = await fetch(`${SAPIBase}/api/feeds/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: title.trim(),
            contentType: file.type,
            fileSize: file.size,
            // placeId를 presign 단계에서 쓸 거면 여기에 추가
            // placeId: selectedPlaceId,
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json().catch(() => null);
          alert(data?.message ?? "이미지 업로드 URL을 가져오지 못했습니다.");
          return;
        }

        const { url, fields, key } = await presignRes.json();
        imageKey = key;

        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) =>
          formData.append(k, v as string)
        );
        formData.append("file", file);

        const s3Res = await fetch(url, {
          method: "POST",
          body: formData,
        });
        if (!s3Res.ok) {
          alert("S3 업로드 실패");
          return;
        }
      }

      // (2) 피드 생성
      const res = await fetch(`${SAPIBase}/api/feeds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim(),
          title: title,
          status,
          placeId: selectedPlaceId,
          imageKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.message ?? "피드를 생성하지 못했습니다.");
        return;
      }

      // 성공 시: 맵 페이지로 이동
      navigate("/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  // 5) 현재 선택된 장소 정보
  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  return (
    <AppLayout
      places={places}
      selectedPlaceId={selectedPlaceId}
      onSelectPlace={handleSelectPlace}
      onClickCreate={() => {
        // 이미 작성 페이지이므로 특별한 동작 없이 현재 페이지 유지
      }}
    >
      <div className="create-feed-page">
        <button
          type="button"
          className="create-feed-back"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          ← 뒤로가기
        </button>

        <div className="create-feed-card">
          <header className="create-feed-header">
            <div className="create-feed-place">
              {selectedPlace
                ? selectedPlace.name
                : "장소를 선택해 새 피드를 작성하세요."}
            </div>
            <h1 className="create-feed-title">새 피드 작성</h1>
            <p className="create-feed-subtitle">
              이 장소에 대한 제목과 내용을 작성하고, 필요한 경우 이미지를
              첨부해 보세요.
            </p>
          </header>

          <form className="create-feed-form" onSubmit={handleSubmit}>
            {/* 제목 */}
            <div className="create-feed-field">
              <label className="create-feed-label">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="create-feed-input"
                placeholder="피드 제목을 입력하세요."
              />
            </div>

            {/* 내용 */}
            <div className="create-feed-field">
              <label className="create-feed-label">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="create-feed-textarea"
                placeholder="이 장소에서의 이야기를 자유롭게 적어주세요."
              />
            </div>

            {/* 공개 범위 */}
            <div className="create-feed-field">
              <label className="create-feed-label">공개 범위</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FeedStatus)}
                className="create-feed-select"
              >
                <option value="PUBLIC">전체 공개</option>
                <option value="FRIENDS">친구 공개</option>
                <option value="PRIVATE">비공개</option>
              </select>
            </div>

            {/* 이미지 업로드 */}
            <div className="create-feed-field">
              <label className="create-feed-label">이미지 (선택)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="create-feed-file-input"
              />
              {file && (
                <div className="create-feed-file-name">
                  선택된 파일: <strong>{file.name}</strong>
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="create-feed-actions">
              <button
                type="button"
                className="create-feed-btn secondary"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="create-feed-btn primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "작성 중..." : "작성하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );

};

export default CreateFeedPage;
