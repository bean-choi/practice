// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { SAPIBase } from "../api";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${SAPIBase}/api/auth/me`, {
          credentials: "include",
        });

        if (res.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (e) {
        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  // 로딩 중 렌더링
  if (checking) return <div>Loading...</div>;

  // 로그인 안 된 경우 → /login 으로 이동
  if (!authenticated) return <Navigate to="/login" replace />;

  // 로그인 되어있다면 페이지 렌더링
  return children;
};

export default ProtectedRoute;
