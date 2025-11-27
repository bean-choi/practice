// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      {/* 나중에 메인 지도 페이지 */}
      {/* <Route path="/map" element={<MapPage />} /> */}
    </Routes>
  );
}

export default App;
