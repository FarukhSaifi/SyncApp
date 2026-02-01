import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "../components/AdminRoute";
import LoadingScreen from "../components/common/LoadingScreen";
import ProtectedRoute from "../components/ProtectedRoute";
import { ROUTES } from "../constants";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Editor = lazy(() => import("../pages/Editor"));
const Login = lazy(() => import("../pages/Login"));
const Profile = lazy(() => import("../pages/Profile"));
const Register = lazy(() => import("../pages/Register"));
const Settings = lazy(() => import("../pages/Settings"));
const Users = lazy(() => import("../pages/Users"));

const SuspenseFallback = () => <LoadingScreen inline message="Loading..." />;

/**
 * Protected (authenticated) routes. Pass posts and editor callbacks from App.
 */
export function ProtectedRoutes({ postsProps, editorProps }) {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <Dashboard
                posts={postsProps.posts}
                loading={postsProps.loading}
                error={postsProps.error}
                onPostUpdate={postsProps.onPostUpdate}
                onPostDelete={postsProps.onPostDelete}
                onRefresh={postsProps.onRefresh}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.EDITOR}
          element={
            <ProtectedRoute>
              <Editor onPostCreate={editorProps.onPostCreate} onPostUpdate={editorProps.onPostUpdate} />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.EDITOR}/:id`}
          element={
            <ProtectedRoute>
              <Editor onPostCreate={editorProps.onPostCreate} onPostUpdate={editorProps.onPostUpdate} />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.USERS}
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  );
}

/**
 * Public (unauthenticated) routes.
 */
export function PublicRoutes() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </Suspense>
  );
}
