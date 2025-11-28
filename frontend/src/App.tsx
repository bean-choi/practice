// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import MapPage from "./pages/MapPage";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestOnlyRoute from "./components/GuestOnlyRoute"
import CreateFeedPage from "./pages/CreateFeedPage.tsx";
import FeedDetailPage from "./pages/FeedDetailPage.tsx";
import PlaceFeedListPage from "./pages/PlaceFeedListPage.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnlyRoute>
            <SignUpPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feeds/new"
        element={
          <ProtectedRoute>
            <CreateFeedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feeds/:feedId"
        element={
          <ProtectedRoute>
            <FeedDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/places/:placeId/feeds"
        element={
          <ProtectedRoute>
            <PlaceFeedListPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
