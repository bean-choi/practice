// src/pages/LoginPage.tsx
import React, { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SAPIBase } from "../api";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${SAPIBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "로그인에 실패했습니다.");
      } else {
        navigate("/map", { replace: true }); // 나중에 /map 페이지 만들면 여기로 이동
      }
    } catch (err) {
      console.error(err);
      setError("서버와 통신에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-login-root">
        {/* 배경 이미지 */}
        <div className="auth-login-bg-wrapper">
            <img
                src="/campus-map.png"
                alt="Campus map"
                className="auth-login-bg"
            />
        </div>

        {/* 반투명 오버레이(배경을 살짝 흐리게) */}
        <div className="auth-login-overlay" />

        {/* 가운데 카드 */}
        <div className="auth-login-center">
            <div className="auth-card">
                <h1 className="auth-logo">Example Logo</h1>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                    <label className="auth-label">Username</label>
                    <input
                        type="text"
                        className="auth-input"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    </div>

                    <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <input
                        type="password"
                        className="auth-input"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button
                    type="submit"
                    disabled={submitting}
                    className="auth-button"
                    >
                    {submitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="auth-footer">
                    <span className="auth-footer-text">회원이 아니신가요? </span>
                    <Link to="/signup" className="auth-footer-link">
                    Register
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;
