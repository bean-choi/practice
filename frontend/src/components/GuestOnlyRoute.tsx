// src/components/GuestOnlyRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { SAPIBase } from "../api";

interface GuestOnlyRouteProps {
  children: React.ReactNode;
}

const GuestOnlyRoute: React.FC<GuestOnlyRouteProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${SAPIBase}/api/auth/me`, {
          credentials: "include",
        });

        if (!cancelled) {
          if (res.ok) {
            setAuthenticated(true);
          } else {
            setAuthenticated(false);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 아직 로그인 여부 확인 중이면 일단 아무것도 안 보여주거나 간단한 로딩 문구만
  if (checking) {
    return <div>Loading...</div>;
  }

  // 이미 로그인한 상태면 /map 으로 보냄
  if (authenticated) {
    return <Navigate to="/map" replace />;
  }

  // 로그인 안 된 상태면 children 렌더링(/login, /signup 등)
  return <>{children}</>;
};

export default GuestOnlyRoute;
