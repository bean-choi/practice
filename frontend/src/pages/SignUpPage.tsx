// src/pages/SignUpPage.tsx
import React, { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SAPIBase } from "../api";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); // UI상 이메일처럼 써도 됨
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${SAPIBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "회원가입에 실패했습니다.");
      } else {
        // 회원가입 후 로그인 페이지로 이동
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError("서버와 통신에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-signup-root">
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

          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="auth-button"
          >
            {submitting ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          <span className="auth-footer-text">이미 계정이 있으신가요? </span>
          <Link to="/login" className="auth-footer-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
